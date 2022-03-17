#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
echo "$SCRIPT_DIR"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/env.sh"
# move to root of git repository
cd "$(git rev-parse --show-toplevel)"

# shellcheck disable=SC2016
npm run build && LOG_LEVEL=warn clinic heapprofiler --autocannon [ --method POST --body '{"measurements":[1,2,3]}' --headers "authorization: Bearer $AUTH_TOKEN" --headers "content-type: application/json" 'localhost:$PORT/api/v3/sensors/2/records' ] -- node -r ts-node/register -r dotenv/config ./src/index.ts
