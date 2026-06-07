# Fix-Hack-Club

A YSWS program associated with PullQuests (for Clubs). Participants submit PRs to improve or fix any part of Hack Club, then log their contributions in a dedicated dashboard.

## Stack

- Next.js 15 (App Router) + TypeScript, src/ layout.
- Postgres via Prisma (`prisma/schema.prisma`).
- Hack Club OAuth with an HMAC-signed session cookie.

## Pages

- `/` Landing page: hero, how it works, live job listings, and the contribution guide.
- `/dashboard` Gated behind Hack Club sign-in. Submit a fix, see your points balance, and track submission statuses.
- `/explore` Public feed of approved contributions plus a top-contributor leaderboard.
- `/u/[id]` Public member profile: points earned, fixes shipped, and approved contributions.
- `/shop` Redeem points for rewards; shows your balance and recent orders.
- `/admin/review` First-grade review, inside the Admin console. Reviewers and admins recommend approve/deny with a reason; this advances a submission to the final admin review.
- `/admin` Admin console. Admins (env allowlist) get the full console: final review of submissions, manage listings, manage shop items, fulfill or refund orders, adjust member balances, and grant/revoke the reviewer role. Reviewers are admitted to the console too but only see the **First review** page — every other section is hidden from their nav and blocked at the page level.

## Reviews & roles

There are three roles (`User.role`): `MEMBER`, `REVIEWER`, and `ADMIN`.

- **Admins** are controlled by the `ADMIN_HACK_CLUB_IDS` env allowlist (see `src/lib/admin.ts`). Admins can do everything, including **both** review stages.
- **Reviewers** are granted in-app by an admin on `/admin/users` (toggles the DB `role`). A reviewer can perform the first-grade review only. The grant is preserved across logins (the OAuth callback won't reset a reviewer back to member).

Submissions move through a **two-stage review**. A submission stays in `status: "Submitted"` for the whole review period; the `reviewStage` column tracks where it is:

1. **First-grade review (`reviewStage: "first"`)** — a reviewer or admin opens `/admin/review`, reads the fix, and records an approve/deny recommendation **with a reason**. This never awards points; it just advances the item to `reviewStage: "final"` and stores `firstReviewStatus` / `firstReviewNote`.
2. **Final review (`reviewStage: "final"`)** — an admin opens `/admin/submissions`, sees the reviewer's recommendation and reason, and makes the final call: **approve** (awards points) or **reject** (records a reason). Admins can also clear the first stage themselves from `/admin/review`, so they can run a submission through both stages.

## Economy

Members link a Hackatime project to a submission. When an admin gives final approval, points are paid at 1 per hour of that project's tracked time (fetched live from Hackatime). Submissions with no linked project fall back to a manual point value. Approving credits the author's balance and lifetime total and writes a ledger entry; rejecting an already-approved fix claws the points back. Points are spent in the shop, which creates an order (admins fulfill or refund). There is no voting.

Admin mutations use Next.js Server Actions (in `src/app/admin/actions.ts` and `src/app/shop/actions.ts`), each guarded by the admin allowlist. First-grade review actions live in `src/app/admin/review/actions.ts` and are guarded so only reviewers or admins can call them.

## Hackatime time tracking

Members connect Hackatime via OAuth (Settings). The callback resolves their Hackatime user id from `GET /api/v1/authenticated/me` and stores it; the token is used once and not persisted. Per-project tracked time is read from the public `GET /api/v1/users/{uid}/stats` endpoint. Register a confidential Hackatime OAuth app with redirect URI `{APP_BASE_URL}/api/hackatime/callback` and set `HACKATIME_CLIENT_ID` / `HACKATIME_CLIENT_SECRET`.

## API routes

App Router route handlers under `src/app/api`:

- `GET /api/listings`
- `GET, POST /api/submissions`
- `GET /api/auth/start`, `/api/auth/callback`, `/api/auth/me`, `/api/auth/logout`
- `GET /api/hackatime/start`, `/api/hackatime/callback`, `/api/hackatime/disconnect`

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
- `ADMIN_HACK_CLUB_IDS`: Comma or space separated Hack Club identity ids that get the ADMIN role and access to `/admin`. (Reviewers are granted in-app from `/admin/users`, not via an env var.)
- `HACKATIME_CLIENT_ID`, `HACKATIME_CLIENT_SECRET`: Hackatime OAuth app credentials (confidential app).
- `HACKATIME_BYPASS_KEYS`: Optional rate-limit bypass header for the Hackatime public stats endpoint.
- `HACKATIME_START_DATE`: Optional fixed epoch (YYYY-MM-DD, default `2026-01-01`) for Hackatime stats so tracked time is a stable running total. Set it to your program's start date to only count time logged after launch.
- `APP_BASE_URL`: Optional but recommended in production. The public origin with no trailing slash (e.g. `https://your-app.onrender.com`). Used to build the OAuth `redirect_uri`. Without it the app derives the origin from `x-forwarded-proto` / `x-forwarded-host`.

The OAuth `redirect_uri` is `<origin>/api/auth/callback`. It must be registered EXACTLY in your Hack Club OAuth app (same scheme and host, no trailing slash). Behind a TLS proxy the scheme must be `https`, so set `APP_BASE_URL` if the auto-detected origin is ever wrong.

## Database

The schema lives in `prisma/schema.prisma`. Core models: `Listing`, `User`, `Submission`, `Devlog`, `LedgerEntry`, `ShopItem`, and `ShopOrder`. The `User.role` enum is `MEMBER | REVIEWER | ADMIN`; submissions carry both the first-grade review fields (`reviewStage`, `firstReviewStatus`, `firstReviewNote`, `firstReviewedAt`, `firstReviewedById`) and the final review fields (`status`, `reviewedAt`, `reviewedById`, `reviewNote`, `pointsAwarded`).

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
