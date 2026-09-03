# syntax=docker/dockerfile:1.7

FROM rust:1.85-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

ENV SQLX_OFFLINE=true
ENV CARGO_TERM_COLOR=always

COPY Cargo.toml Cargo.lock ./
COPY .sqlx ./.sqlx
COPY migrations ./migrations
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release --locked \
    && cp /app/target/release/twitter-clone /usr/local/bin/twitter-clone

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 tini \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --uid 10001 appuser

COPY --from=builder /usr/local/bin/twitter-clone /usr/local/bin/twitter-clone
COPY migrations /app/migrations

USER appuser
WORKDIR /app

ENV BIND_ADDR=0.0.0.0:8080
ENV RUST_LOG=info,sqlx=warn

EXPOSE 8080

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["twitter-clone"]
