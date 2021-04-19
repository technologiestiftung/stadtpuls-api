#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

node packages/next-iot-hub-api/dist/index.js
