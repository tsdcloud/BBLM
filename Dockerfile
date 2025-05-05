#ARG NODE_VERSION=20.10.0
#
#FROM node:${NODE_VERSION}-alpine as base
#
#WORKDIR /usr/src/app
#
#FROM base as deps
#
#RUN --mount=type=bind,source=package.json,target=package.json \
#    --mount=type=bind,source=package-lock.json,target=package-lock.json \
#    --mount=type=cache,target=/root/.npm \
#    npm ci --omit=dev
#
#
#FROM deps as build
#
#RUN --mount=type=bind,source=package.json,target=package.json \
#    --mount=type=bind,source=package-lock.json,target=package-lock.json \
#    --mount=type=cache,target=/root/.npm \
#    npm ci
#
#COPY . .
#
#RUN npm run build
#
#FROM base as final
#
#ENV NODE_ENV production
#
#USER node
#
#COPY package.json .
#COPY --from=deps /usr/src/app/node_modules ./node_modules
#COPY --from=build /usr/src/app/dist ./dist
#EXPOSE 3000
#CMD npm start


# Utiliser une image Node.js LTS comme base
FROM node:20.10
LABEL maintainer="ysiaka@bfclimited.com"

# Définir le répertoire de travail
WORKDIR /App/Incident

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --force

# RUN npm install @prisma/client@5.12.0 prisma@5.12.0

# Copier le reste des fichiers du projet
COPY . .


# Générer le client Prisma
RUN npx prisma migrate

# RUN npm install prisma --save-dev --force
# RUN npm install express --force
#RUN npx prisma migrate dev --name init

# Exposer le port utilisé par l'application
EXPOSE 4000

# Lancer l'application
CMD ["node", "./src/index.js"]
