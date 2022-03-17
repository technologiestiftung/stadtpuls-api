#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

for i in $(seq 1000); do
  # echo "$i"
  curl --silent --location --request POST 'http://localhost:4000/api/v3/sensors/2/records' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGU4MzYyOS1lNGU2LTQ1NDgtOWMzZi1jZDhiMGE3ZjFlODQiLCJqdGkiOiJkMDg1YmQyNi1jNTM5LTRmNjctODYxMS05YzMwZGMyZGFlYWYiLCJpYXQiOjE2NDc0NDQ5ODZ9.ftiIN_k6YCIsO9ZGW87QKluWTCm2QkeCu2aviNYChGs' \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "latitude": 52.483107,
    "longitude": 13.390679,
    "altitude": 30,
    "measurements": [
        1,
        2,
        3
    ]
}' >/dev/null
done
