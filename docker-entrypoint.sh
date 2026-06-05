#!/bin/sh
set -e

# ── Connection-URL cleaning ──────────────────────────────────────────────────
# Make a Postgres connection URL safe for Prisma, which is strict about format:
#   1. strip surrounding single/double quotes (common when a URL is pasted into
#      a dashboard env field with quotes around it)
#   2. strip leading/trailing whitespace / newlines
#   3. rewrite the postgres:// scheme to postgresql:// (Prisma only accepts the
#      latter; Render, Supabase, Railway, etc. often hand out postgres://)
clean_db_url() {
  printf '%s' "$1" \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
          -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" \
          -e 's|^postgres://|postgresql://|'
}

DATABASE_URL="$(clean_db_url "${DATABASE_URL:-}")"
export DATABASE_URL

# Render's managed Postgres needs no separate direct connection, so fall back
# to DATABASE_URL when DIRECT_URL is not set (the schema declares directUrl).
DIRECT_URL="$(clean_db_url "${DIRECT_URL:-$DATABASE_URL}")"
export DIRECT_URL

# ── Safe diagnostic ──────────────────────────────────────────────────────────
scheme="$(printf '%s' "$DATABASE_URL" | sed -n 's|^\([a-zA-Z0-9+.-]*\)://.*|\1|p')"
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is empty. Set it in the Render dashboard (use the Internal Database URL)." >&2
  exit 1
elif [ -z "$scheme" ]; then
  echo "ERROR: DATABASE_URL has no '<scheme>://' prefix (length=${#DATABASE_URL})." >&2
  echo "       It is probably not a connection URL — e.g. the Render 'PSQL Command'" >&2
  echo "       was pasted instead of the 'Internal Database URL'. Expected form:" >&2
  echo "       postgresql://USER:PASSWORD@HOST:5432/DBNAME" >&2
  exit 1
else
  echo "Database URL scheme detected: ${scheme}://"
fi

# ── Migrations ───────────────────────────────────────────────────────────────
PRISMA="node_modules/.bin/prisma"

if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Applying Prisma migrations (migrate deploy)..."
  "$PRISMA" migrate deploy
else
  echo "No migrations found. Syncing schema with prisma db push..."
  "$PRISMA" db push --skip-generate
fi

# ── Slack ticket bot (Socket Mode, background process) ────────────────────────
# Starts only when both Slack tokens are set, so the app works fine without
# Slack configured.
if [ -n "${SLACK_APP_TOKEN}" ] && [ -n "${SLACK_BOT_TOKEN}" ]; then
  echo "Starting Mergeus ticket bot (Socket Mode)..."
  node bot.mjs &
fi

# ── Next.js server ───────────────────────────────────────────────────────────
echo "Starting Next.js server..."
exec node server.js
