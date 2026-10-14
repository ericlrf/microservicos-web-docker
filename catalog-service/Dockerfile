FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Um lockfile gerado e versionado ativa npm ci automaticamente.
# Sem lockfile, dependencias transitivas podem variar entre builds.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force
COPY --chown=node:node . .
USER node
EXPOSE 3001
CMD ["node", "server.js"]
