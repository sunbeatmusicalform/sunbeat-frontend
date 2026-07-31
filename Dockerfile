# Build do front Sunbeat (Vite/React) — imagem estática via nginx
FROM node:20-alpine AS build
WORKDIR /app

# variáveis de build (Vite embute no bundle)
ARG VITE_API_URL=https://sunbeat-backend.fly.dev
ARG VITE_API_ENABLED=1
ARG VITE_TABLES_API_URL=https://sunbeat-backend.fly.dev/workspaces/atabaque/tables
ENV VITE_API_URL=$VITE_API_URL \
    VITE_API_ENABLED=$VITE_API_ENABLED \
    VITE_TABLES_API_URL=$VITE_TABLES_API_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
