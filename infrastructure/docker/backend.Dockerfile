FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/main/backend ./src/main/backend
RUN npm run build:backend

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN apk upgrade --no-cache \
  && npm ci --omit=dev \
  && npm cache clean --force \
  && rm -f package.json package-lock.json \
  && rm -rf /usr/local/lib/node_modules/npm \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --from=build /app/dist/backend ./dist/backend
COPY src/main/config ./src/main/config

EXPOSE 3000

CMD ["node", "dist/backend/server.js"]
