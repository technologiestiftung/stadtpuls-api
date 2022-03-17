#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# signin
curl --request POST \
  --url 'http://localhost:8000/auth/v1/token?grant_type=password' \
  --header 'apikey: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYyNzIwODU0MCwiZXhwIjoxOTc0MzYzNzQwLCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.sUHErUOiKZ3nHQIxy-7jND6B80Uzf9G4NtMLmL6HXPQ' \
  --header 'content-type: application/json' \
  --header 'user-agent: vscode-restclient' \
  --data '{"email": "hash@ff6347.email","password": "123password"}' >access_token.json
