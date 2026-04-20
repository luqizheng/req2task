FROM zhcoder-docker-registry.com:8000/builder/node:v22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm@9.0.0 && pnpm install

COPY . .
RUN pnpm build

FROM zhcoder-docker-registry.com:8000/library/node:v22-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install -g pnpm@9.0.0 && pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
