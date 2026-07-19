#!/usr/bin/env bash
# Reset the LOCAL development/CI database: drop schema, apply the Supabase
# auth shim, run every migration in order, load seed data.
#
# Usage:
#   scripts/db-reset.sh                      # uses the docker-compose db
#   DATABASE_URL=postgres://... scripts/db-reset.sh
#
# NEVER run against a Supabase project: the shim would conflict with the real
# auth schema. Production migrations are applied via the Supabase SQL editor
# or CLI (see docs/deployment-guide.md).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://coloursense:coloursense@localhost:54329/coloursense}"

if [[ "$DATABASE_URL" == *"supabase.co"* ]]; then
  echo "Refusing to run against a Supabase URL. This script is for local/CI databases only." >&2
  exit 1
fi

PSQL=(psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --quiet)

echo "Resetting schema..."
"${PSQL[@]}" -c "drop schema if exists public cascade; create schema public;" \
  -c "drop schema if exists auth cascade;"

echo "Applying auth shim (local Supabase compatibility)..."
"${PSQL[@]}" -f "$ROOT/scripts/db/auth_shim.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "Applying $(basename "$migration")..."
  "${PSQL[@]}" -f "$migration"
done

echo "Re-granting on newly created objects..."
"${PSQL[@]}" -c "grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;" \
  -c "grant usage, select on all sequences in schema public to anon, authenticated, service_role;" \
  -c "grant execute on all functions in schema public to anon, authenticated, service_role;"

echo "Loading seed data..."
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"

echo "Database ready."
