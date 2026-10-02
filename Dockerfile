# Vite + React financial simulator — build to static, serve with nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS run
# Static files plus a config with security headers (see nginx/default.conf).
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Run as the image's unprivileged nginx user. Docker lets containers bind
# port 80 without root (net.ipv4.ip_unprivileged_port_start=0). The "user"
# directive only applies to a root master process, so it is dropped.
RUN sed -i "/^user /d" /etc/nginx/nginx.conf \
  && touch /run/nginx.pid \
  && chown nginx:nginx /run/nginx.pid \
  && chown -R nginx:nginx /var/cache/nginx
USER nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
