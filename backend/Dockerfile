FROM node:22-alpine

# Prisma necesita openssl en Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install && npx prisma generate

COPY . .
RUN mkdir -p /app/uploads

EXPOSE 4000

# Regenera el cliente, aplica migraciones pendientes y arranca con recarga automática
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]