FROM node:24-alpine3.21 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG BUILD_CMD=dev
RUN npm run build -- --configuration "${BUILD_CMD}"


FROM nginx:stable
COPY default.conf /etc/nginx/conf.d
COPY --from=build /app/dist/cont-app-ang19 /usr/share/nginx/html
EXPOSE 80