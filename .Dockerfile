# Usa una imagen base de Node.js
FROM node:18

# Crea un directorio de trabajo
WORKDIR /usr/src/app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto que usa tu aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "index.js"]