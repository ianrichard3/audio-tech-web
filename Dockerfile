# Build
FROM node:20-alpine AS build
WORKDIR /app

# Build args para Vite (se inyectan en build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime con 'serve' (sin Nginx)
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
