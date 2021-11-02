#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# dump all data with pg_dump without schema

docker run --rm --volume "$(pwd)":/dump \
  --workdir /dump \
  --network="host" \
  --env PGPASSWORD=$PGPASSWORD \
  --env PGUSER=$PGUSER \
  --env PGHOST=$PGHOST \
  --env PGDATABASE=$PGDATABASE \
  --env PGPORT=$PGPORT \
  postgres:13.3 pg_dump \
  --format=custom \
  --verbose \
  --table='auth.users' \
  --table='public.*' \
  --exclude-table='public.categories' \
  --exclude-table='public.auth_tokens' \
  --username $PGUSER \
  --host $PGHOST $PGDATABASE >$STADTPULS_DUMP_PATH
