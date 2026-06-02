#!/bin/sh
set -e

# ── URL scheme normalisation ─────────────────────────────────────────────────
# Prisma requires the postgresql:// scheme.  Several hosting providers
# (Render managed Postgres, Supabase, Railway, etc.) supply postgres:// URLs.
# Rewrite the scheme here so the container works regardless of the provider.
normalise_db_url() {
  printf '%s' "$1" | sed 's|^postgres://|postgresql://|'
}

DATABASE_URL="$(normalise_db_url "${DATABASE_URL:-}")"
export DATABASE_URL

# Render's managed Postgres needs no separate direct connection, so fall back
# to DATABASE_URL when DIRECT_URL is not set (the schema declares directUrl).
DIRECT_URL="$(normalise_db_url "${DIRECT_URL:-$DATABASE_URL}")"
export DIRECT_URL

# ── Migrations ───────────────────────────────────────────────────────────────
PRISMA="node_modules/.bin/prisma"

if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Applying Prisma migrations (migrate deploy)..."
  "$PRISMA" migrate deploy
else
  echo "No migrations found. Syncing schema with prisma db push..."
  "$PRISMA" db push --skip-generate
fi

# ── Server ───────────────────────────────────────────────────────────────────
echo "Starting Next.js server..."
exec node server.js
