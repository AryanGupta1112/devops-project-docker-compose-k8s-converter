FROM node:20-alpine AS build
WORKDIR /app/src/main/frontend

COPY src/main/frontend/package*.json ./
RUN npm ci

COPY src/main/frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk upgrade --no-cache
COPY --from=build /app/src/main/frontend/dist /usr/share/nginx/html
EXPOSE 80
