# Makefile para Clinical Records AI - Despliegue GCP
# Sistema médico seguro con cumplimiento HIPAA/GDPR

.PHONY: help setup build deploy clean status logs test backup restore

# Variables por defecto
PROJECT_ID ?= clinical-records-prod
REGION ?= us-central1
CLUSTER_NAME ?= clinical-records-cluster

# Colores para output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Target por defecto
help: ## Mostrar ayuda
	@echo "${BLUE}🏥 Clinical Records AI - Despliegue GCP${NC}"
	@echo "${BLUE}===========================================${NC}"
	@echo ""
	@echo "Comandos disponibles:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${GREEN}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Variables de entorno:"
	@echo "  PROJECT_ID=${PROJECT_ID}"
	@echo "  REGION=${REGION}"
	@echo "  CLUSTER_NAME=${CLUSTER_NAME}"

setup: ## Configurar entorno de desarrollo
	@echo "${BLUE}🔧 Configurando entorno...${NC}"
	@./scripts/config.sh validate
	@./scripts/config.sh generate
	@echo "${GREEN}✅ Entorno configurado${NC}"

check-deps: ## Verificar dependencias
	@echo "${BLUE}🔍 Verificando dependencias...${NC}"
	@command -v gcloud >/dev/null 2>&1 || { echo "${RED}❌ gcloud no instalado${NC}"; exit 1; }
	@command -v kubectl >/dev/null 2>&1 || { echo "${RED}❌ kubectl no instalado${NC}"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "${RED}❌ docker no instalado${NC}"; exit 1; }
	@echo "${GREEN}✅ Todas las dependencias están instaladas${NC}"

auth: ## Autenticarse en GCP
	@echo "${BLUE}🔐 Autenticando en GCP...${NC}"
	@gcloud auth login
	@gcloud auth application-default login
	@gcloud config set project $(PROJECT_ID)
	@echo "${GREEN}✅ Autenticación completada${NC}"

create-cluster: ## Crear cluster GKE
	@echo "${BLUE}🚀 Creando cluster GKE...${NC}"
	@gcloud container clusters create $(CLUSTER_NAME) \
		--region=$(REGION) \
		--num-nodes=3 \
		--enable-autoscaling \
		--min-nodes=3 \
		--max-nodes=10 \
		--machine-type=e2-standard-2 \
		--enable-shielded-nodes \
		--enable-network-policy \
		--workload-pool=$(PROJECT_ID).svc.id.goog
	@echo "${GREEN}✅ Cluster creado${NC}"

get-credentials: ## Obtener credenciales del cluster
	@echo "${BLUE}🔑 Obteniendo credenciales...${NC}"
	@gcloud container clusters get-credentials $(CLUSTER_NAME) --region=$(REGION)
	@echo "${GREEN}✅ Credenciales configuradas${NC}"

build: ## Construir imágenes Docker
	@echo "${BLUE}🔨 Construyendo imágenes Docker...${NC}"
	@gcloud auth configure-docker
	@cd backend && docker build -t gcr.io/$(PROJECT_ID)/clinical-records-backend:latest .
	@cd frontend && docker build -t gcr.io/$(PROJECT_ID)/clinical-records-frontend:latest .
	@echo "${GREEN}✅ Imágenes construidas${NC}"

push: ## Subir imágenes a GCR
	@echo "${BLUE}📤 Subiendo imágenes...${NC}"
	@docker push gcr.io/$(PROJECT_ID)/clinical-records-backend:latest
	@docker push gcr.io/$(PROJECT_ID)/clinical-records-frontend:latest
	@echo "${GREEN}✅ Imágenes subidas${NC}"

deploy-k8s: ## Desplegar aplicación en Kubernetes
	@echo "${BLUE}🚢 Desplegando en Kubernetes...${NC}"
	@kubectl apply -f kubernetes/00-namespace-config.yaml
	@kubectl apply -f kubernetes/secrets.yaml
	@kubectl apply -f kubernetes/01-backend-deployment.yaml
	@kubectl apply -f kubernetes/02-frontend-deployment.yaml
	@kubectl apply -f kubernetes/03-ingress.yaml
	@echo "${GREEN}✅ Aplicación desplegada${NC}"

deploy: check-deps setup build push deploy-k8s ## Despliegue completo
	@echo "${GREEN}🎉 Despliegue completado exitosamente!${NC}"

status: ## Verificar estado del despliegue
	@echo "${BLUE}📊 Estado del sistema:${NC}"
	@echo ""
	@echo "${YELLOW}Namespaces:${NC}"
	@kubectl get namespaces | grep clinical-records || echo "No encontrado"
	@echo ""
	@echo "${YELLOW}Pods:${NC}"
	@kubectl get pods -n clinical-records -o wide || echo "No encontrados"
	@echo ""
	@echo "${YELLOW}Services:${NC}"
	@kubectl get services -n clinical-records || echo "No encontrados"
	@echo ""
	@echo "${YELLOW}Ingress:${NC}"
	@kubectl get ingress -n clinical-records || echo "No encontrado"
	@echo ""
	@echo "${YELLOW}HPA:${NC}"
	@kubectl get hpa -n clinical-records || echo "No encontrado"

logs: ## Ver logs de la aplicación
	@echo "${BLUE}📋 Logs del sistema:${NC}"
	@echo ""
	@echo "${YELLOW}Backend logs:${NC}"
	@kubectl logs -l app=clinical-records-backend -n clinical-records --tail=20 || echo "No disponibles"
	@echo ""
	@echo "${YELLOW}Frontend logs:${NC}"
	@kubectl logs -l app=clinical-records-frontend -n clinical-records --tail=20 || echo "No disponibles"

logs-follow: ## Seguir logs en tiempo real
	@echo "${BLUE}📋 Siguiendo logs...${NC}"
	@kubectl logs -f -l app=clinical-records-backend -n clinical-records

scale-up: ## Escalar aplicación hacia arriba
	@echo "${BLUE}📈 Escalando aplicación...${NC}"
	@kubectl scale deployment clinical-records-backend --replicas=5 -n clinical-records
	@kubectl scale deployment clinical-records-frontend --replicas=3 -n clinical-records
	@echo "${GREEN}✅ Aplicación escalada${NC}"

scale-down: ## Escalar aplicación hacia abajo
	@echo "${BLUE}📉 Reduciendo escala...${NC}"
	@kubectl scale deployment clinical-records-backend --replicas=2 -n clinical-records
	@kubectl scale deployment clinical-records-frontend --replicas=1 -n clinical-records
	@echo "${GREEN}✅ Escala reducida${NC}"

restart: ## Reiniciar aplicación
	@echo "${BLUE}🔄 Reiniciando aplicación...${NC}"
	@kubectl rollout restart deployment clinical-records-backend -n clinical-records
	@kubectl rollout restart deployment clinical-records-frontend -n clinical-records
	@echo "${GREEN}✅ Aplicación reiniciada${NC}"

update: build push ## Actualizar aplicación con nuevas imágenes
	@echo "${BLUE}🔄 Actualizando aplicación...${NC}"
	@kubectl set image deployment/clinical-records-backend backend=gcr.io/$(PROJECT_ID)/clinical-records-backend:latest -n clinical-records
	@kubectl set image deployment/clinical-records-frontend frontend=gcr.io/$(PROJECT_ID)/clinical-records-frontend:latest -n clinical-records
	@kubectl rollout status deployment/clinical-records-backend -n clinical-records
	@kubectl rollout status deployment/clinical-records-frontend -n clinical-records
	@echo "${GREEN}✅ Aplicación actualizada${NC}"

rollback: ## Rollback a versión anterior
	@echo "${BLUE}↩️ Haciendo rollback...${NC}"
	@kubectl rollout undo deployment/clinical-records-backend -n clinical-records
	@kubectl rollout undo deployment/clinical-records-frontend -n clinical-records
	@echo "${GREEN}✅ Rollback completado${NC}"

backup: ## Crear backup de la base de datos
	@echo "${BLUE}💾 Creando backup...${NC}"
	@gcloud sql backups create --instance=clinical-records-db --description="Backup manual $(shell date)"
	@echo "${GREEN}✅ Backup creado${NC}"

list-backups: ## Listar backups disponibles
	@echo "${BLUE}📋 Backups disponibles:${NC}"
	@gcloud sql backups list --instance=clinical-records-db

restore: ## Restaurar desde backup (requiere BACKUP_ID)
	@echo "${BLUE}🔄 Restaurando desde backup...${NC}"
	@if [ -z "$(BACKUP_ID)" ]; then echo "${RED}❌ Especifique BACKUP_ID=xxx${NC}"; exit 1; fi
	@gcloud sql backups restore $(BACKUP_ID) --restore-instance=clinical-records-db
	@echo "${GREEN}✅ Restauración completada${NC}"

test: ## Ejecutar tests de conectividad
	@echo "${BLUE}🧪 Ejecutando tests...${NC}"
	@kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -- \
		curl -f http://clinical-records-backend.clinical-records.svc.cluster.local:8080/health
	@echo "${GREEN}✅ Tests completados${NC}"

security-scan: ## Escanear imágenes por vulnerabilidades
	@echo "${BLUE}🔍 Escaneando seguridad...${NC}"
	@gcloud beta container images scan gcr.io/$(PROJECT_ID)/clinical-records-backend:latest
	@gcloud beta container images scan gcr.io/$(PROJECT_ID)/clinical-records-frontend:latest
	@echo "${GREEN}✅ Escaneo completado${NC}"

get-ip: ## Obtener IP externa del ingress
	@echo "${BLUE}🌐 IP externa:${NC}"
	@kubectl get ingress clinical-records-ingress -n clinical-records -o jsonpath='{.status.loadBalancer.ingress[0].ip}' && echo

get-url: ## Obtener URL de la aplicación
	@echo "${BLUE}🔗 URLs de acceso:${NC}"
	@echo "Frontend: https://$(shell kubectl get ingress clinical-records-ingress -n clinical-records -o jsonpath='{.spec.rules[0].host}')"
	@echo "API: https://$(shell kubectl get ingress clinical-records-ingress -n clinical-records -o jsonpath='{.spec.rules[1].host}')"

clean: ## Limpiar recursos de desarrollo
	@echo "${YELLOW}⚠️ Eliminando recursos locales...${NC}"
	@docker system prune -f
	@echo "${GREEN}✅ Limpieza completada${NC}"

destroy: ## PELIGRO: Eliminar todo el despliegue
	@echo "${RED}⚠️ PELIGRO: Esto eliminará TODO el despliegue${NC}"
	@echo "${RED}¿Está seguro? Escriba 'YES' para continuar:${NC}"
	@read confirm && [ "$$confirm" = "YES" ] || exit 1
	@kubectl delete namespace clinical-records || true
	@gcloud sql instances delete clinical-records-db --quiet || true
	@gcloud container clusters delete $(CLUSTER_NAME) --region=$(REGION) --quiet || true
	@echo "${GREEN}✅ Recursos eliminados${NC}"

monitoring: ## Configurar monitoreo
	@echo "${BLUE}📊 Configurando monitoreo...${NC}"
	@kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
	@echo "${GREEN}✅ Monitoreo configurado${NC}"

# Targets de desarrollo
dev-backend: ## Ejecutar backend en modo desarrollo
	@echo "${BLUE}🔧 Iniciando backend en desarrollo...${NC}"
	@cd backend && npm run dev

dev-frontend: ## Ejecutar frontend en modo desarrollo
	@echo "${BLUE}🔧 Iniciando frontend en desarrollo...${NC}"
	@cd frontend && npm start

install-deps: ## Instalar dependencias de desarrollo
	@echo "${BLUE}📦 Instalando dependencias...${NC}"
	@cd backend && npm install
	@cd frontend && npm install
	@echo "${GREEN}✅ Dependencias instaladas${NC}"

# Información del sistema
info: ## Mostrar información del sistema
	@echo "${BLUE}ℹ️ Información del sistema:${NC}"
	@echo "Proyecto GCP: $(PROJECT_ID)"
	@echo "Región: $(REGION)"
	@echo "Cluster: $(CLUSTER_NAME)"
	@echo ""
	@echo "Contexto kubectl actual:"
	@kubectl config current-context
	@echo ""
	@echo "Versión de herramientas:"
	@gcloud version --format="value(Google Cloud SDK)" 2>/dev/null || echo "gcloud no disponible"
	@kubectl version --client --short 2>/dev/null || echo "kubectl no disponible"
	@docker version --format '{{.Client.Version}}' 2>/dev/null || echo "docker no disponible"