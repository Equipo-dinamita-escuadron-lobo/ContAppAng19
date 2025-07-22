FROM node:24-alpine3.21 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG BUILD_CMD=dev
RUN npm run build -- --configuration "${BUILD_CMD}" --base-href /${BUILD_CMD}/


FROM httpd:alpine3.18
WORKDIR /usr/local/apache2/htdocs/
COPY --from=build /app/dist/*/browser .
EXPOSE 80