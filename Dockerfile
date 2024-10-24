FROM node:20-slim AS base

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 3000
CMD ["node", "index.mjs"]