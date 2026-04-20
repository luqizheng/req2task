FROM zhcoder-docker-registry.com:8000/library/node:v22-slim as builder

# RUN apt-get update && apt-get install -y --no-install-recommends \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
COPY src ./src
RUN  npm install

FROM zhcoder-docker-registry.com:8000/library/node:v22-alpine AS publisher

COPY --from=builder /app /app
WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/src /app/src

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/gateway.js"]
