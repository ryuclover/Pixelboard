# Build stage para backend Node.js
FROM node:18-alpine

WORKDIR /app

# Copiar package.json do backend
COPY backend/package.json backend/package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código do backend
COPY backend/ .

# Gerar Prisma client
RUN npm run build

# Exposar porta
EXPOSE 3001

# Start
CMD ["npm", "start"]
