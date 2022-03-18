#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ACCESS_TOKEN=$(jq -r '.access_token' <"$SCRIPT_DIR/access_token.json")

# auth token
curl --request POST \
  --url http://localhost:4000/api/v3/authtokens \
  --header "authorization: Bearer $ACCESS_TOKEN" \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"description": "testing new tokens 345"}' >auth_token.json
