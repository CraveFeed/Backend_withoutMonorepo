FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY src/db/prisma ./prisma/

RUN npm install && \
    npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]