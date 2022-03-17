#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
# shellcheck disable=SC2016
clinic doctor --on-port 'autocannon --method POST --body '{"measurements":[1,2,3]}' --headers "authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NDc0NDU1MDAsInN1YiI6IjlkZTgzNjI5LWU0ZTYtNDU0OC05YzNmLWNkOGIwYTdmMWU4NCIsImVtYWlsIjoiaGFzaEBmZjYzNDcuZW1haWwiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQifQ.vJwRE8asHZ5bvvtQ2n91rzPIPpkL4bielBM9TYQSNbI" localhost:$PORT/api/v3/sensors/2/records' -- node -r dotenv/config ./dist/index.js
