#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# dump all data with pg_dump without schema

PGPORT=5432
PGHOST="localhost"
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD="your-super-secret-and-long-postgres-password"

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
  --username $PGUSER \
  --host $PGHOST $PGDATABASE >supabase.dump
