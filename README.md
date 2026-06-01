# Fix-Hack-Club

A YSWS program associated with PullQuests (for Clubs). Participants submit PRs to improve or fix any part of Hack Club, then log their contributions in a dedicated dashboard.

## Stack

- Vite (vanilla JS), multi-page: a public landing page (`index.html`) and a dedicated dashboard (`dashboard.html`, served at `/dashboard`).
- Vercel serverless functions in `api/`.
- Postgres via Prisma (`prisma/schema.prisma`).
- Hack Club OAuth with an HMAC-signed session cookie.

## Pages

- `/` Landing page: hero, how it works, live job listings, and the contribution guide.
- `/dashboard` Dashboard: gated behind Hack Club sign-in. Submit a fix, track your submissions, and view your profile.

## Local Development

```bash
npm install
cp .env.example .env   # then fill in the values
npm run db:push        # create tables in your database
npm run db:seed        # load the starter listings from listings.json
npm run dev
```

`npm run dev` runs the same API handlers that ship to Vercel, so local behavior matches production.

## Environment Variables

- `DATABASE_URL`: Postgres connection string. On serverless, use a pooled connection (for example Neon or Supabase pooler).
- `DIRECT_URL`: Optional direct (non-pooled) connection used by Prisma for migrations.
- `HACKCLUB_CLIENT_ID`, `HACKCLUB_CLIENT_SECRET`: Hack Club OAuth credentials.
- `HACKCLUB_AUTH_HOST`: Optional, defaults to `https://auth.hackclub.com`.
- `SESSION_SECRET`: Secret used to sign the session cookie.

## Database

The schema lives in `prisma/schema.prisma` with three models: `Listing`, `User`, and `Submission`.

- `npm run db:push` syncs the schema to the database (good for first setup).
- `npm run db:migrate` runs committed migrations (`prisma migrate deploy`) for production.
- `npm run db:seed` upserts the listings defined in `listings.json`.

## Deploy (Vercel)

```bash
npm run build
```

`prisma generate` runs automatically on `postinstall` and `build`. Set the environment variables above in the Vercel dashboard, and run `prisma migrate deploy` (or `db push`) against your production database.
