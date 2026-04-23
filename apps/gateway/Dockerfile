FROM zhcoder-docker-registry.com:8000/builder/node:v22-slim AS builder

WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY ./apps/gateway ./apps/gateway 
COPY ./package.json ./package.json

RUN npm install -g pnpm && pnpm install

#COPY . .
RUN pnpm build:gateway

FROM zhcoder-docker-registry.com:8000/library/node:v22-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init curl iputils-ping 

RUN rm -rf /var/lib/apt/lists/*
#COPY package*.json pnpm-workspace.yaml ./
#RUN npm install -g pnpm && pnpm install --prod

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=builder /app/apps/gateway/node_modules ./apps/gateway/node_modules

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/gateway/dist/main.js"]
