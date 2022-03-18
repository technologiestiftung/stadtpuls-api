#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

hash clinic 2>/dev/null || {
  echo >&2 "I require clinic but it's not installed.  Aborting."
  exit 1
}
hash autocannon 2>/dev/null || {
  echo >&2 "I require autocannon but it's not installed.  Aborting."
  exit 1
}
hash npm 2>/dev/null || {
  echo >&2 "I require npm but it's not installed.  Aborting."
  exit 1
}
hash node 2>/dev/null || {
  echo >&2 "I require node but it's not installed.  Aborting."
  exit 1
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
echo "$SCRIPT_DIR"
# shellcheck disable=SC2034
AUTH_TOKEN=$(jq -r '.data.token' <"$SCRIPT_DIR/auth_token.json")
