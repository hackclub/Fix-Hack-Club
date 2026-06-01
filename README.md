# Fix-Hack-Club

A YSWS program associated with PullQuests (for Clubs). Participants submit PRs to improve or fix any part of Hack Club, then log their contributions in a dedicated dashboard.

## Stack

- Next.js 15 (App Router) + TypeScript, src/ layout.
- Postgres via Prisma (`prisma/schema.prisma`).
- Hack Club OAuth with an HMAC-signed session cookie.

## Pages

- `/` Landing page: hero, how it works, live job listings, and the contribution guide.
- `/dashboard` Dashboard: gated behind Hack Club sign-in (the page reads the session cookie server-side). Submit a fix, track your submissions, and view your profile.

## API routes

App Router route handlers under `src/app/api`:

- `GET /api/listings`
- `GET, POST /api/submissions`
- `GET /api/auth/start`, `/api/auth/callback`, `/api/auth/me`, `/api/auth/logout`

## Local Development

```bash
npm install
cp .env.example .env   # then fill in the values
npm run db:push        # create tables in your database
npm run db:seed        # load the starter listings from listings.json
npm run dev
```

## Environment Variables

- `DATABASE_URL`: Postgres connection string. On serverless, use a pooled connection (for example Neon or Supabase pooler).
- `DIRECT_URL`: Optional direct (non-pooled) connection used by Prisma for migrations.
- `HACKCLUB_CLIENT_ID`, `HACKCLUB_CLIENT_SECRET`: Hack Club OAuth credentials.
- `HACKCLUB_AUTH_HOST`: Optional, defaults to `https://auth.hackclub.com`.
- `SESSION_SECRET`: Secret used to sign the session cookie.

The Hack Club OAuth app's redirect URI is `{origin}/api/auth/callback`.

## Database

The schema lives in `prisma/schema.prisma` with three models: `Listing`, `User`, and `Submission`.

- `npm run db:push` syncs the schema to the database (good for first setup).
- `npm run db:migrate` runs committed migrations (`prisma migrate deploy`) for production.
- `npm run db:seed` upserts the listings defined in `listings.json`.

## Deploy (Vercel)

Vercel auto-detects Next.js. `prisma generate` runs on `postinstall` and `build`. Set the environment variables above in the Vercel dashboard, and run `prisma migrate deploy` (or `db push`) against your production database.

## Deploy (Render, Docker)

The repo ships a multi-stage `Dockerfile` (Next.js standalone output) plus a `render.yaml` blueprint.

1. Create a Render web service from this repo (or use the blueprint). It builds from the `Dockerfile`.
2. Set the environment variables in the Render dashboard: `DATABASE_URL`, `HACKCLUB_CLIENT_ID`, `HACKCLUB_CLIENT_SECRET`, and `SESSION_SECRET`. `DIRECT_URL` is optional and falls back to `DATABASE_URL` (Render's managed Postgres needs no separate direct connection).
3. On each start, `docker-entrypoint.sh` applies the schema: `prisma migrate deploy` if `prisma/migrations` exists, otherwise `prisma db push`. Then it starts the standalone server.

Notes:
- The Hack Club OAuth redirect URI must point at the Render URL: `https://<your-app>.onrender.com/api/auth/callback`.
- The runtime image copies the full `node_modules` so the Prisma CLI can run migrations at startup. For multi-instance setups, prefer Render's Pre-Deploy Command for migrations and simplify the container start to `node server.js`.
