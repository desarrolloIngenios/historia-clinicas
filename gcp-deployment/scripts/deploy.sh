#!/bin/bash

# Script de despliegue en GCP/GKE
# Clinical Records AI - Sistema Médico Seguro

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_ID="${PROJECT_ID:-your-project-id}"
CLUSTER_NAME="${CLUSTER_NAME:-clinical-records-cluster}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
DOMAIN="${DOMAIN:-clinical-records.your-domain.com}"

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."
    
    commands=("gcloud" "kubectl" "docker")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd no está instalado"
            exit 1
        fi
    done
    
    log_success "Todas las dependencias están instaladas"
}

# Configurar proyecto GCP
setup_gcp_project() {
    log_info "Configurando proyecto GCP: $PROJECT_ID"
    
    gcloud config set project $PROJECT_ID
    
    # Habilitar APIs necesarias
    log_info "Habilitando APIs de GCP..."
    gcloud services enable \
        container.googleapis.com \
        compute.googleapis.com \
        sql-component.googleapis.com \
        sqladmin.googleapis.com \
        cloudkms.googleapis.com \
        logging.googleapis.com \
        monitoring.googleapis.com \
        secretmanager.googleapis.com \
        storage-component.googleapis.com
    
    log_success "Proyecto GCP configurado"
}

# Crear cluster GKE
create_gke_cluster() {
    log_info "Creando cluster GKE: $CLUSTER_NAME"
    
    # Verificar si el cluster ya existe
    if gcloud container clusters describe $CLUSTER_NAME --region=$REGION &> /dev/null; then
        log_warning "El cluster $CLUSTER_NAME ya existe"
        return 0
    fi
    
    # Crear cluster con configuración de seguridad
    gcloud container clusters create $CLUSTER_NAME \
        --region=$REGION \
        --num-nodes=3 \
        --min-nodes=3 \
        --max-nodes=10 \
        --enable-autoscaling \
        --machine-type=e2-standard-2 \
        --disk-type=pd-ssd \
        --disk-size=50GB \
        --enable-autorepair \
        --enable-autoupgrade \
        --enable-network-policy \
        --enable-ip-alias \
        --enable-shielded-nodes \
        --shielded-secure-boot \
        --shielded-integrity-monitoring \
        --enable-autostart \
        --enable-pod-security-policy \
        --workload-pool=$PROJECT_ID.svc.id.goog \
        --addons=HorizontalPodAutoscaling,HttpLoadBalancing,NetworkPolicy,ConfigConnector \
        --labels=environment=production,compliance=hipaa-gdpr,application=clinical-records
    
    log_success "Cluster GKE creado exitosamente"
}

# Configurar kubectl
configure_kubectl() {
    log_info "Configurando kubectl..."
    
    gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION
    
    # Verificar conexión
    kubectl cluster-info
    
    log_success "kubectl configurado"
}

# Crear base de datos Cloud SQL
create_cloud_sql() {
    log_info "Creando instancia Cloud SQL..."
    
    INSTANCE_NAME="clinical-records-db"
    
    # Verificar si la instancia ya existe
    if gcloud sql instances describe $INSTANCE_NAME &> /dev/null; then
        log_warning "La instancia Cloud SQL $INSTANCE_NAME ya existe"
        return 0
    fi
    
    # Crear instancia PostgreSQL
    gcloud sql instances create $INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-custom-2-8192 \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=50GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --retained-backups-count=7 \
        --retained-transaction-log-days=7 \
        --enable-bin-log \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --maintenance-release-channel=production \
        --deletion-protection \
        --require-ssl
    
    # Crear base de datos
    gcloud sql databases create clinical_records --instance=$INSTANCE_NAME
    
    # Crear usuario
    gcloud sql users create postgres --instance=$INSTANCE_NAME --password=$(openssl rand -base64 32)
    
    log_success "Cloud SQL configurado"
}

# Configurar service accounts e IAM
setup_iam() {
    log_info "Configurando IAM y service accounts..."
    
    # Service account para la aplicación
    gcloud iam service-accounts create clinical-records \
        --display-name="Clinical Records Service Account" \
        --description="Service account para Clinical Records en GKE"
    
    # Asignar roles necesarios
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:clinical-records@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/cloudsql.client"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:clinical-records@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:clinical-records@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/storage.objectAdmin"
    
    # Crear clave de service account
    gcloud iam service-accounts keys create ./service-account-key.json \
        --iam-account=clinical-records@$PROJECT_ID.iam.gserviceaccount.com
    
    log_success "IAM configurado"
}

# Construir y subir imágenes Docker
build_and_push_images() {
    log_info "Construyendo y subiendo imágenes Docker..."
    
    # Configurar Docker para GCR
    gcloud auth configure-docker
    
    # Backend
    log_info "Construyendo imagen del backend..."
    cd ../backend
    docker build -t gcr.io/$PROJECT_ID/clinical-records-backend:latest .
    docker push gcr.io/$PROJECT_ID/clinical-records-backend:latest
    
    # Frontend
    log_info "Construyendo imagen del frontend..."
    cd ../frontend
    docker build -t gcr.io/$PROJECT_ID/clinical-records-frontend:latest .
    docker push gcr.io/$PROJECT_ID/clinical-records-frontend:latest
    
    cd ../scripts
    log_success "Imágenes construidas y subidas"
}

# Crear secrets en Kubernetes
create_k8s_secrets() {
    log_info "Creando secrets en Kubernetes..."
    
    # Secret para Cloud SQL
    kubectl create secret generic cloud-sql-key \
        --from-file=service_account.json=./service-account-key.json \
        --namespace=clinical-records
    
    log_success "Secrets creados"
}

# Desplegar aplicación
deploy_application() {
    log_info "Desplegando aplicación en Kubernetes..."
    
    # Aplicar manifiestos
    kubectl apply -f ../kubernetes/00-namespace-config.yaml
    kubectl apply -f ../kubernetes/01-backend-deployment.yaml
    kubectl apply -f ../kubernetes/02-frontend-deployment.yaml
    
    # Esperar a que los pods estén listos
    log_info "Esperando a que los pods estén listos..."
    kubectl wait --for=condition=ready pod -l app=clinical-records-backend -n clinical-records --timeout=300s
    kubectl wait --for=condition=ready pod -l app=clinical-records-frontend -n clinical-records --timeout=300s
    
    log_success "Aplicación desplegada"
}

# Configurar ingress y SSL
setup_ingress() {
    log_info "Configurando ingress y SSL..."
    
    # Instalar cert-manager si no está instalado
    if ! kubectl get namespace cert-manager &> /dev/null; then
        log_info "Instalando cert-manager..."
        kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
        kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s
    fi
    
    # Aplicar ingress
    kubectl apply -f ../kubernetes/03-ingress.yaml
    
    log_success "Ingress configurado"
}

# Verificar despliegue
verify_deployment() {
    log_info "Verificando despliegue..."
    
    # Verificar pods
    kubectl get pods -n clinical-records
    
    # Verificar servicios
    kubectl get services -n clinical-records
    
    # Verificar ingress
    kubectl get ingress -n clinical-records
    
    # Obtener IP externa
    EXTERNAL_IP=$(kubectl get ingress clinical-records-ingress -n clinical-records -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ ! -z "$EXTERNAL_IP" ]; then
        log_success "Despliegue completado. IP externa: $EXTERNAL_IP"
        log_info "Configure su DNS para apuntar $DOMAIN a $EXTERNAL_IP"
    else
        log_warning "IP externa aún no asignada. Verifique más tarde."
    fi
}

# Función principal
main() {
    log_info "🏥 Iniciando despliegue de Clinical Records AI en GCP"
    log_info "=================================================="
    
    check_dependencies
    setup_gcp_project
    create_gke_cluster
    configure_kubectl
    create_cloud_sql
    setup_iam
    build_and_push_images
    create_k8s_secrets
    deploy_application
    setup_ingress
    verify_deployment
    
    log_success "🎉 Despliegue completado exitosamente!"
    log_info "La aplicación estará disponible en: https://$DOMAIN"
    log_warning "Recuerde configurar los DNS records para apuntar a la IP externa"
}

# Ejecutar script principal
main "$@"