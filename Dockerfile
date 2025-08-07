# Etapa de build
FROM node:24-alpine3.21 AS build

WORKDIR /app

# 1. Copiar solo archivos de dependencias
COPY package*.json ./

# 2. Instalar dependencias reproducibles y cacheables
RUN npm ci

# 3. Copiar el resto del código (esto invalida el cache solo si cambia el código fuente)
COPY . .

# 4. Argumento de entorno (ej: dev, prod, etc.)
ARG CONFIGURATION=dev
ARG DEPLOY_URL=dev

# 5. Build con configuración
RUN npm run build -- --configuration "${CONFIGURATION}" --deploy-url /${DEPLOY_URL}/

# Etapa final
FROM httpd:alpine3.18

ARG DEPLOY_URL=dev

# 6. Establecer carpeta de destino
WORKDIR /usr/local/apache2/htdocs/

# 7. Crear subdirectorio para la build específica
RUN mkdir -p /usr/local/apache2/htdocs/${DEPLOY_URL}

# 8. Copiar archivos compilados
COPY --from=build /app/dist/*/browser/ /usr/local/apache2/htdocs/${DEPLOY_URL}/

EXPOSE 80
