#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

./node_modules/.bin/pnpm multi install
./node_modules/.bin/pnpm run -r build --filter "*fastify-supabase"
./node_modules/.bin/pnpm run -r build --filter "*next-iot-hub-api"
