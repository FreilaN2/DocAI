# Etapa 1: Construcción
FROM node:20-slim AS build

WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Etapa 2: Servidor de producción
FROM nginx:alpine

# Copia los archivos construidos desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Ejecuta Nginx
CMD ["nginx", "-g", "daemon off;"]
