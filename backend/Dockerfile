FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=base /app/package*.json ./
RUN npm install --omit=dev
COPY --from=base /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
