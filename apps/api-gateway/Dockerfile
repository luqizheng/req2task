FROM ghcr.io/rust-lang/rust:1.76 as builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock* ./
COPY .cargo/ .cargo/
COPY src/ ./src/

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/api-gateway /app/api-gateway
COPY config.yaml /app/config.yaml

ENV RUST_LOG=info

EXPOSE 8080 8081 8082

ENTRYPOINT ["/app/api-gateway"]
CMD ["start", "--config", "/app/config.yaml"]
