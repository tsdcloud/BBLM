FROM node:20.10
LABEL maintainer="ysiaka@bfclimited.com"

# Définir le répertoire de travail
WORKDIR /App/BBLM


# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --force

# RUN npm install @prisma/client@5.12.0 prisma@5.12.0

# Copier le reste des fichiers du projet
COPY . .

RUN npx prisma generate

# Générer le client Prisma
RUN npx prisma migrate

# RUN npm install prisma --save-dev --force
# RUN npm install express --force
#RUN npx prisma migrate dev --name init

# Exposer le port utilisé par l'application
EXPOSE 8080

# Lancer l'application
CMD ["node", "./src/index.js"]
