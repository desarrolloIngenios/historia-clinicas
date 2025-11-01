# Multi-stage build para React
FROM node:18-alpine AS builder

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --silent

# Copiar código fuente
COPY . .

# Construir aplicación para producción
RUN npm run build:production

# Etapa de producción con Nginx
FROM nginx:1.24-alpine AS production

# Instalar dependencias necesarias
RUN apk add --no-cache ca-certificates tzdata

# Configurar zona horaria
ENV TZ=America/Bogota

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos desde builder
COPY --from=builder /app/build /usr/share/nginx/html

# Crear usuario no-root
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Configurar permisos
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Crear directorios necesarios
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx

# Cambiar a usuario no-root
USER nginx

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]