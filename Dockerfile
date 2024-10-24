FROM node:20-slim AS base

WORKDIR /app
COPY . .
RUN npm install

ENTRYPOINT ["/bin/node"]
CMD ["/index.mjs"]