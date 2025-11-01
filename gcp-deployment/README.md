# 🏥 Clinical Records AI - Despliegue en Google Cloud Platform

Sistema médico seguro con cumplimiento HIPAA/GDPR desplegado en Google Kubernetes Engine (GKE).

## 🎯 Características de Seguridad Implementadas

### 🔐 Seguridad de Aplicación
- ✅ **Autenticación JWT** con roles múltiples
- ✅ **Cifrado AES-256** con salt dinámico y PBKDF2
- ✅ **Auditoría completa** con trazabilidad forense
- ✅ **Control de acceso granular** por roles y permisos
- ✅ **Sanitización de entradas** contra XSS/SQL injection
- ✅ **Rate limiting** y protección DDoS
- ✅ **Headers de seguridad** configurados

### ⚖️ Cumplimiento Normativo
- ✅ **HIPAA** (Health Insurance Portability and Accountability Act)
- ✅ **GDPR** (General Data Protection Regulation)
- ✅ **Ley 1581/2012** Colombia (Protección de Datos Personales)
- ✅ **Resolución 1995/1999** Colombia (Historia Clínica Digital)

### 🛡️ Seguridad de Infraestructura
- ✅ **GKE con Shielded Nodes**
- ✅ **Network Policies** para microsegmentación
- ✅ **Cloud SQL** con cifrado en tránsito y reposo
- ✅ **SSL/TLS** con certificados automáticos
- ✅ **Service Mesh** para comunicación segura
- ✅ **Secrets management** con Google Secret Manager

## 🚀 Arquitectura de Despliegue

```
Internet
    ↓
[Google Cloud Load Balancer] ← SSL/TLS Certificates
    ↓
[Google Kubernetes Engine]
    ├── Frontend (React + Nginx) ← Replicas: 2-5
    ├── Backend (Node.js + Express) ← Replicas: 3-10
    └── Cloud SQL Proxy
         ↓
[Cloud SQL PostgreSQL] ← Cifrado + Backups
    ↓
[Cloud Storage] ← Archivos cifrados
```

## 📋 Prerrequisitos

### 1. Herramientas Requeridas
```bash
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# kubectl
gcloud components install kubectl

# Docker
# Instalar desde: https://docs.docker.com/get-docker/
```

### 2. Configuración GCP
```bash
# Autenticarse en GCP
gcloud auth login
gcloud auth application-default login

# Configurar proyecto
gcloud config set project YOUR_PROJECT_ID
```

### 3. Habilitar APIs
```bash
gcloud services enable \
  container.googleapis.com \
  compute.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  cloudkms.googleapis.com \
  secretmanager.googleapis.com
```

## 🔧 Configuración de Despliegue

### 1. Configurar Variables de Entorno
```bash
cd gcp-deployment/scripts
./config.sh show  # Mostrar configuración actual
```

Editar `config.sh` con sus valores:
```bash
export PROJECT_ID="su-proyecto-gcp"
export DOMAIN="clinical-records.su-dominio.com"
export API_DOMAIN="api.clinical-records.su-dominio.com"
```

### 2. Generar Configuraciones
```bash
./config.sh validate  # Validar configuración
./config.sh generate  # Generar archivos de configuración
```

### 3. Configurar Secretos
```bash
# Editar las claves de seguridad en config.sh
# IMPORTANTE: Generar nuevas claves para producción
export JWT_SECRET=$(openssl rand -base64 64)
export ENCRYPTION_KEY=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 32)
```

## 🚀 Despliegue Automático

### Opción 1: Despliegue Completo (Recomendado)
```bash
cd gcp-deployment/scripts
./deploy.sh
```

Este script realizará:
1. ✅ Verificación de dependencias
2. ✅ Configuración del proyecto GCP
3. ✅ Creación del cluster GKE
4. ✅ Configuración de Cloud SQL
5. ✅ Setup de IAM y Service Accounts
6. ✅ Construcción y subida de imágenes Docker
7. ✅ Despliegue en Kubernetes
8. ✅ Configuración de SSL/TLS automático

### Opción 2: Despliegue Manual Paso a Paso

#### 1. Crear Cluster GKE
```bash
gcloud container clusters create clinical-records-cluster \
  --region=us-central1 \
  --num-nodes=3 \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=10 \
  --machine-type=e2-standard-2 \
  --enable-shielded-nodes \
  --enable-network-policy \
  --workload-pool=PROJECT_ID.svc.id.goog
```

#### 2. Configurar kubectl
```bash
gcloud container clusters get-credentials clinical-records-cluster --region=us-central1
```

#### 3. Crear Cloud SQL
```bash
gcloud sql instances create clinical-records-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-8192 \
  --region=us-central1 \
  --require-ssl \
  --backup-start-time=03:00
```

#### 4. Construir Imágenes Docker
```bash
# Backend
cd backend
docker build -t gcr.io/PROJECT_ID/clinical-records-backend:latest .
docker push gcr.io/PROJECT_ID/clinical-records-backend:latest

# Frontend
cd ../frontend
docker build -t gcr.io/PROJECT_ID/clinical-records-frontend:latest .
docker push gcr.io/PROJECT_ID/clinical-records-frontend:latest
```

#### 5. Desplegar en Kubernetes
```bash
cd ../kubernetes
kubectl apply -f 00-namespace-config.yaml
kubectl apply -f secrets.yaml  # Generado por config.sh
kubectl apply -f 01-backend-deployment.yaml
kubectl apply -f 02-frontend-deployment.yaml
kubectl apply -f 03-ingress.yaml
```

## 🌍 Configuración de DNS

### 1. Obtener IP Externa
```bash
kubectl get ingress clinical-records-ingress -n clinical-records
```

### 2. Configurar Records DNS
```
Tipo: A
Nombre: clinical-records.su-dominio.com
Valor: [IP_EXTERNA_DEL_INGRESS]

Tipo: A
Nombre: api.clinical-records.su-dominio.com
Valor: [IP_EXTERNA_DEL_INGRESS]
```

## 📊 Monitoreo y Mantenimiento

### 1. Verificar Estado
```bash
# Estado de pods
kubectl get pods -n clinical-records

# Logs de aplicación
kubectl logs -f deployment/clinical-records-backend -n clinical-records
kubectl logs -f deployment/clinical-records-frontend -n clinical-records

# Estado del cluster
kubectl top nodes
kubectl top pods -n clinical-records
```

### 2. Escalado
```bash
# Escalado manual
kubectl scale deployment clinical-records-backend --replicas=5 -n clinical-records

# Ver HPA (Horizontal Pod Autoscaler)
kubectl get hpa -n clinical-records
```

### 3. Actualizaciones
```bash
# Actualizar imagen del backend
kubectl set image deployment/clinical-records-backend \
  backend=gcr.io/PROJECT_ID/clinical-records-backend:v2.1 \
  -n clinical-records

# Rolling update status
kubectl rollout status deployment/clinical-records-backend -n clinical-records

# Rollback si es necesario
kubectl rollout undo deployment/clinical-records-backend -n clinical-records
```

## 🔒 Configuración de Seguridad Adicional

### 1. Firewall Rules
```bash
# Permitir solo tráfico HTTPS
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTPS traffic"

# Bloquear tráfico HTTP directo
gcloud compute firewall-rules create deny-http \
  --action deny \
  --rules tcp:80 \
  --source-ranges 0.0.0.0/0
```

### 2. Cloud Armor (DDoS Protection)
```bash
# Crear política de seguridad
gcloud compute security-policies create clinical-records-policy \
  --description "Security policy for Clinical Records"

# Regla anti-DDoS
gcloud compute security-policies rules create 1000 \
  --security-policy clinical-records-policy \
  --action "deny-403" \
  --expression "origin.region_code == 'CN' || origin.region_code == 'RU'"
```

### 3. Backup Automático
```bash
# Configurar backup de Cloud SQL
gcloud sql instances patch clinical-records-db \
  --backup-start-time=03:00 \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7
```

## 📈 Costos Estimados (USD/mes)

| Componente | Configuración | Costo Estimado |
|------------|--------------|----------------|
| GKE Cluster | 3-10 nodos e2-standard-2 | $200-650 |
| Cloud SQL | db-custom-2-8192 + 50GB SSD | $180 |
| Load Balancer | Global HTTPS | $20 |
| Storage | 100GB | $20 |
| Egress | 1TB/mes | $120 |
| **Total** | | **$540-990/mes** |

## 🚨 Consideraciones de Seguridad

### ⚠️ CRÍTICO - Antes de Producción:
1. **Cambiar todas las claves por defecto** en `config.sh`
2. **Configurar autenticación 2FA** para acceso GCP
3. **Revisar y aplicar políticas IAM** restrictivas
4. **Configurar alertas de seguridad** en Cloud Monitoring
5. **Realizar penetration testing** y auditoría de seguridad
6. **Configurar logs de auditoría** centralizados
7. **Implementar disaster recovery** plan
8. **Documentar procedimientos** de respuesta a incidentes

### 🔐 Cumplimiento HIPAA/GDPR:
- ✅ Cifrado en tránsito y reposo
- ✅ Control de acceso granular
- ✅ Auditoría completa
- ✅ Backup y recovery
- ✅ Gestión de consentimientos
- ✅ Derecho al olvido
- ✅ Políticas de retención

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre cumplimiento normativo:
- 📧 Email: admin@clinical-records.com
- 📖 Documentación: https://docs.clinical-records.com
- 🐛 Issues: https://github.com/clinical-records/issues

---

## 📄 Licencia

Este proyecto está licenciado bajo MIT License para uso educativo y desarrollo.
Para uso comercial en entornos médicos reales, consulte con el equipo legal.

**⚠️ ADVERTENCIA LEGAL**: Este sistema está diseñado para cumplir con estándares de seguridad médica, pero debe ser revisado por expertos en compliance antes de uso en producción con datos reales de pacientes.