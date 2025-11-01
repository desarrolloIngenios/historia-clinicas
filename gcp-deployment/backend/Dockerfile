# Multi-stage build para optimizar tamaño de imagen
FROM node:18-alpine AS builder

# Crear directorio de aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción solamente
RUN npm ci --only=production && npm cache clean --force

# Etapa de producción
FROM node:18-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Establecer zona horaria
ENV TZ=America/Bogota

# Crear directorio de aplicación
WORKDIR /app

# Copiar dependencias desde builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Configurar variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto
EXPOSE 8080

# Cambiar a usuario no-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { \
        if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Comando de inicio
CMD ["node", "server.js"]