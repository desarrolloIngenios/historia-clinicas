#!/bin/bash

# Script de prueba de conectividad para Clinical Records AI
# Sistema médico seguro - Verificación de endpoints

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Iniciando pruebas de conectividad...${NC}"
echo "========================================"

# Variables de configuración
NAMESPACE="clinical-records"
BACKEND_SERVICE="clinical-records-backend"
FRONTEND_SERVICE="clinical-records-frontend"
INGRESS_NAME="clinical-records-ingress"

# Función para mostrar estado
show_status() {
    local service=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "ok" ]; then
        echo -e "✅ ${GREEN}$service${NC}: $message"
    elif [ "$status" = "warning" ]; then
        echo -e "⚠️  ${YELLOW}$service${NC}: $message"
    else
        echo -e "❌ ${RED}$service${NC}: $message"
    fi
}

# Verificar que kubectl esté configurado
echo -e "${BLUE}🔍 Verificando configuración...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    show_status "kubectl" "error" "No configurado o sin acceso al cluster"
    exit 1
fi
show_status "kubectl" "ok" "Configurado correctamente"

# Verificar namespace
echo -e "\n${BLUE}📁 Verificando namespace...${NC}"
if kubectl get namespace $NAMESPACE &> /dev/null; then
    show_status "Namespace" "ok" "$NAMESPACE existe"
else
    show_status "Namespace" "error" "$NAMESPACE no encontrado"
    exit 1
fi

# Verificar deployments
echo -e "\n${BLUE}🚀 Verificando deployments...${NC}"
backend_ready=$(kubectl get deployment $BACKEND_SERVICE -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
backend_desired=$(kubectl get deployment $BACKEND_SERVICE -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

if [ "$backend_ready" = "$backend_desired" ] && [ "$backend_ready" != "0" ]; then
    show_status "Backend Deployment" "ok" "$backend_ready/$backend_desired pods listos"
else
    show_status "Backend Deployment" "warning" "$backend_ready/$backend_desired pods listos"
fi

frontend_ready=$(kubectl get deployment $FRONTEND_SERVICE -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
frontend_desired=$(kubectl get deployment $FRONTEND_SERVICE -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

if [ "$frontend_ready" = "$frontend_desired" ] && [ "$frontend_ready" != "0" ]; then
    show_status "Frontend Deployment" "ok" "$frontend_ready/$frontend_desired pods listos"
else
    show_status "Frontend Deployment" "warning" "$frontend_ready/$frontend_desired pods listos"
fi

# Verificar services
echo -e "\n${BLUE}🔗 Verificando services...${NC}"
if kubectl get service $BACKEND_SERVICE -n $NAMESPACE &> /dev/null; then
    backend_ip=$(kubectl get service $BACKEND_SERVICE -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    show_status "Backend Service" "ok" "IP: $backend_ip"
else
    show_status "Backend Service" "error" "No encontrado"
fi

if kubectl get service $FRONTEND_SERVICE -n $NAMESPACE &> /dev/null; then
    frontend_ip=$(kubectl get service $FRONTEND_SERVICE -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    show_status "Frontend Service" "ok" "IP: $frontend_ip"
else
    show_status "Frontend Service" "error" "No encontrado"
fi

# Verificar ingress
echo -e "\n${BLUE}🌐 Verificando ingress...${NC}"
if kubectl get ingress $INGRESS_NAME -n $NAMESPACE &> /dev/null; then
    external_ip=$(kubectl get ingress $INGRESS_NAME -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    if [ "$external_ip" != "pending" ] && [ "$external_ip" != "" ]; then
        show_status "Ingress" "ok" "IP externa: $external_ip"
    else
        show_status "Ingress" "warning" "IP externa pendiente de asignación"
    fi
else
    show_status "Ingress" "error" "No encontrado"
fi

# Pruebas de conectividad interna
echo -e "\n${BLUE}🔌 Probando conectividad interna...${NC}"

# Test backend health endpoint
echo "Probando endpoint de salud del backend..."
kubectl run test-pod-health --image=curlimages/curl --rm -i --restart=Never -n $NAMESPACE -- \
    curl -s -f http://$BACKEND_SERVICE.$NAMESPACE.svc.cluster.local:8080/health 2>/dev/null && \
    show_status "Backend Health" "ok" "Endpoint responde correctamente" || \
    show_status "Backend Health" "error" "Endpoint no responde"

# Test database connection
echo "Probando conexión a base de datos..."
kubectl run test-pod-db --image=curlimages/curl --rm -i --restart=Never -n $NAMESPACE -- \
    curl -s -f http://$BACKEND_SERVICE.$NAMESPACE.svc.cluster.local:8080/api/health/db 2>/dev/null && \
    show_status "Database Connection" "ok" "Base de datos accesible" || \
    show_status "Database Connection" "warning" "Base de datos no accesible o endpoint no implementado"

# Test frontend
echo "Probando frontend..."
kubectl run test-pod-frontend --image=curlimages/curl --rm -i --restart=Never -n $NAMESPACE -- \
    curl -s -f http://$FRONTEND_SERVICE.$NAMESPACE.svc.cluster.local:80/ 2>/dev/null && \
    show_status "Frontend" "ok" "Página principal carga correctamente" || \
    show_status "Frontend" "error" "Frontend no responde"

# Verificar logs por errores
echo -e "\n${BLUE}📋 Verificando logs por errores...${NC}"
backend_errors=$(kubectl logs -l app=$BACKEND_SERVICE -n $NAMESPACE --tail=100 | grep -i "error\|exception\|failed" | wc -l)
if [ "$backend_errors" -eq 0 ]; then
    show_status "Backend Logs" "ok" "Sin errores en logs recientes"
else
    show_status "Backend Logs" "warning" "$backend_errors errores encontrados en logs"
fi

frontend_errors=$(kubectl logs -l app=$FRONTEND_SERVICE -n $NAMESPACE --tail=100 | grep -i "error\|exception\|failed" | wc -l)
if [ "$frontend_errors" -eq 0 ]; then
    show_status "Frontend Logs" "ok" "Sin errores en logs recientes"
else
    show_status "Frontend Logs" "warning" "$frontend_errors errores encontrados en logs"
fi

# Verificar recursos
echo -e "\n${BLUE}💻 Verificando uso de recursos...${NC}"
backend_cpu=$(kubectl top pod -l app=$BACKEND_SERVICE -n $NAMESPACE --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum}' || echo "N/A")
backend_memory=$(kubectl top pod -l app=$BACKEND_SERVICE -n $NAMESPACE --no-headers 2>/dev/null | awk '{sum+=$3} END {print sum}' || echo "N/A")

if [ "$backend_cpu" != "N/A" ]; then
    show_status "Backend Resources" "ok" "CPU: ${backend_cpu}m, Memory: ${backend_memory}Mi"
else
    show_status "Backend Resources" "warning" "Métricas no disponibles (metrics-server requerido)"
fi

# Verificar persistencia
echo -e "\n${BLUE}💾 Verificando persistencia...${NC}"
pvc_count=$(kubectl get pvc -n $NAMESPACE 2>/dev/null | wc -l)
if [ "$pvc_count" -gt 1 ]; then
    show_status "Persistent Volumes" "ok" "$((pvc_count-1)) volúmenes encontrados"
else
    show_status "Persistent Volumes" "warning" "Sin volúmenes persistentes configurados"
fi

# Verificar secretos
echo -e "\n${BLUE}🔐 Verificando secretos...${NC}"
secret_count=$(kubectl get secrets -n $NAMESPACE 2>/dev/null | grep -v default-token | wc -l)
if [ "$secret_count" -gt 0 ]; then
    show_status "Secrets" "ok" "$secret_count secretos configurados"
else
    show_status "Secrets" "warning" "Sin secretos personalizados encontrados"
fi

# Resumen final
echo -e "\n${BLUE}📊 Resumen de la verificación${NC}"
echo "================================"

# URLs de acceso si están disponibles
if [ "$external_ip" != "pending" ] && [ "$external_ip" != "" ]; then
    echo -e "🌐 ${GREEN}URLs de acceso:${NC}"
    echo "   Frontend: https://clinical-records.example.com (configurar DNS)"
    echo "   API: https://api.clinical-records.example.com (configurar DNS)"
    echo "   IP: $external_ip"
else
    echo -e "⏳ ${YELLOW}Esperando asignación de IP externa...${NC}"
    echo "   Ejecute: kubectl get ingress $INGRESS_NAME -n $NAMESPACE -w"
fi

# Comandos útiles
echo -e "\n🛠️  ${BLUE}Comandos útiles:${NC}"
echo "   Ver estado: kubectl get all -n $NAMESPACE"
echo "   Ver logs: kubectl logs -f deployment/$BACKEND_SERVICE -n $NAMESPACE"
echo "   Escalar: kubectl scale deployment $BACKEND_SERVICE --replicas=3 -n $NAMESPACE"
echo "   Port-forward: kubectl port-forward service/$FRONTEND_SERVICE 8080:80 -n $NAMESPACE"

echo -e "\n${GREEN}✅ Verificación completada${NC}"