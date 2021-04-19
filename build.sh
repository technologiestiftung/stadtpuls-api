#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

npm install -g pnpm@6.0.2
pnpm multi install
pnpm run -r build --filter "*fastify-supabase"
pnpm run -r build --filter "*next-iot-hub-api"
