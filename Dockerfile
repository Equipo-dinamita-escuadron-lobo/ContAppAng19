FROM node:21-alpine3.21 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx gcc --properties es2023 browser module main --first only --create-ivy-entry-points

COPY . .
ARG BUILD_CMD="ng build:dev"
RUN $BUILD_CMD

FROM nginx:stable
COPY default.conf /etc/nginx/conf.d
COPY --from=build /app/dist/cont-app-ang19 /usr/share/nginx/html
EXPOSE 80