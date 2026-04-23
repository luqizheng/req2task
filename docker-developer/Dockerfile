FROM zhcoder-docker-registry.com:8000/library/node:v22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    openssh-client \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash developer

WORKDIR /workspace

RUN mkdir -p /home/developer/.ssh && \
    chmod 700 /home/developer/.ssh

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

ENV NODE_ENV=production
ENV WORKSPACE=/workspace
ENV LOG_LEVEL=info

USER developer

CMD ["node", "dist/index.js"]
