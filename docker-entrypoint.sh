#!/bin/sh
set -e

# Render's managed Postgres needs no separate direct connection, so fall back
# to DATABASE_URL when DIRECT_URL is not set (the schema declares directUrl).
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

PRISMA="node_modules/.bin/prisma"

if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Applying Prisma migrations (migrate deploy)..."
  "$PRISMA" migrate deploy
else
  echo "No migrations found. Syncing schema with prisma db push..."
  "$PRISMA" db push --skip-generate
fi

echo "Starting Next.js server..."
exec node server.js
