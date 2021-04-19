#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

npm install pnpm@6.0.2
./node_modules/.bin/pnpm multi install
./node_modules/.bin/pnpm run -r build --filter "*fastify-supabase"
./node_modules/.bin/pnpm run -r build --filter "*next-iot-hub-api"
