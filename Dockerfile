FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma -v
RUN npx prisma generate
RUN ls -la node_modules/.prisma/client
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed && node dist/src/main.js"]
