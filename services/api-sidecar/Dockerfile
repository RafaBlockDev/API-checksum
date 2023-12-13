# Utilizar una imagen base de Node.js
FROM node:18

# Instalar @substrate/api-sidecar globalmente
RUN npm install -g @substrate/api-sidecar

# Exponer el puerto por defecto de @substrate/api-sidecar
EXPOSE 8080

# Comando para ejecutar @substrate/api-sidecar
CMD ["substrate-api-sidecar"]
