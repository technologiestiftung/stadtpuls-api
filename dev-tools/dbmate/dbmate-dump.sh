#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

function main() {
  docker run --rm -it --network=host \
    -v "$(pwd)/docker/postgres/docker-entrypoint-initdb.d:/db" \
    -v "$(pwd)/migrations:/migrations" \
    ghcr.io/amacneil/dbmate:1.12.1 \
    --url "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable" \
    --migrations-dir "/migrations" dump "$@"
}

main
