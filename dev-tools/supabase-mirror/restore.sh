#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

docker run \
  --rm \
  --volume "$(pwd)":/dump \
  --workdir /dump \
  --network="host" \
  --env PGPASSWORD=$PGPASSWORD \
  --env PGUSER=$PGUSER \
  --env PGHOST=$PGHOST \
  --env PGDATABASE=$PGDATABASE \
  --env PGPORT=$PGPORT \
  postgres:13.3 pg_restore \
  --host $PGHOST \
  --dbname $PGDATABASE \
  --username $PGUSER \
  --exit-on-error \
  --no-privileges \
  --no-acl \
  --disable-triggers \
  --data-only \
  --no-owner \
  $STADTPULS_DUMP_PATH
# --clean \
