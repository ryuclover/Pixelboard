# Backend Node.js para Render.com
FROM node:18-alpine

WORKDIR /app

# Copiar package.json do backend
COPY package.json package-lock.json ./

# Instalar dependências (incluindo devDependencies para o prisma CLI)
RUN npm ci

# Copiar código do backend
COPY . .

# Gerar Prisma client
RUN npx prisma generate

# Exposar porta
EXPOSE 3001

# Rodar migrations e iniciar servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
