#  Stage 1 : Build React avec Vite 
FROM node:20-alpine AS builder
WORKDIR /app

# Copier et installer les dépendances (cache layer)
COPY frontend/package*.json ./
RUN npm ci --silent

# Copier les sources et builder
COPY frontend/ .
RUN npm run build


#  Stage 2 : Servir avec Nginx 
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Supprimer la config Nginx par défaut
RUN rm -rf ./*

# Copier le build React
COPY --from=builder /app/dist .

# Copier la config Nginx personnalisée
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
