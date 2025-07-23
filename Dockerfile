FROM node:24-alpine3.21 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG BUILD_CMD=dev
RUN npm run build -- --configuration "${BUILD_CMD}" --deploy-url /${BUILD_CMD}/


FROM httpd:alpine3.18
ARG BUILD_CMD=dev
WORKDIR /usr/local/apache2/htdocs/
RUN mkdir -p /usr/local/apache2/htdocs/${BUILD_CMD}
COPY --from=build /app/dist/*/browser/ /usr/local/apache2/htdocs/${BUILD_CMD}/
EXPOSE 80