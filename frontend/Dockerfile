FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

ARG AUTH_SERVICE_BASE=http://auth-service:3000
ARG AUTH_SERVICE_HOST=auth-service
ARG GALLERY_SERVICE_BASE=http://gallery-service:3001
ARG GALLERY_SERVICE_HOST=gallery-service
ARG STATS_URL=https://fullstack-cloudit-stats.azurewebsites.net

COPY nginx.conf.template /tmp/nginx.conf.template
RUN envsubst '${AUTH_SERVICE_BASE} ${AUTH_SERVICE_HOST} ${GALLERY_SERVICE_BASE} ${GALLERY_SERVICE_HOST} ${STATS_URL}' < /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

COPY --from=build /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
