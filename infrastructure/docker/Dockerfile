FROM node:20-alpine AS frontend-build
WORKDIR /app/src/main/frontend

COPY src/main/frontend/package*.json ./
RUN npm ci

COPY src/main/frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/main/backend ./src/main/backend
RUN npm run build:backend

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/public

COPY package*.json ./
RUN apk upgrade --no-cache \
  && npm ci --omit=dev \
  && npm cache clean --force \
  && rm -f package.json package-lock.json \
  && rm -rf /usr/local/lib/node_modules/npm \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --from=backend-build /app/dist/backend ./dist/backend
COPY --from=frontend-build /app/src/main/frontend/dist ./public
COPY src/main/config ./src/main/config

EXPOSE 8080

CMD ["node", "dist/backend/server.js"]
