#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

PGPORT=5433
PGHOST="localhost"
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD="postgres"

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
  supabase.dump
# --clean \
