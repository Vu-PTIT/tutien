FROM node:22.14.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY vendor ./vendor
RUN npm run build
FROM heroiclabs/nakama:3.37.0
COPY --from=builder /app/build/index.js /nakama/data/modules/index.js
