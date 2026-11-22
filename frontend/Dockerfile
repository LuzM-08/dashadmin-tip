# ---- Etapa 1: compilar la SPA ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .

# Las variables VITE_* se incorporan al compilar. En producción la API se llama por la misma dirección (/api)
# y el menú "Cambiar vista (solo pruebas)" queda desactivado.
ARG VITE_API_URL=/api
ARG VITE_MODO_PRUEBAS=false
ENV VITE_API_URL=$VITE_API_URL VITE_MODO_PRUEBAS=$VITE_MODO_PRUEBAS
RUN npm run build

# ---- Etapa 2: servir con nginx ----
FROM nginx:stable-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1
