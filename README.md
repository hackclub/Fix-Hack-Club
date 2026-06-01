# Fix-Hack-Club
A YSWS program associated with PullQuests (for Clubs). Participants will be able to submit PRs to improve or fix any part of Hack Club!

##
This is currently running in vite:
### Local Development
```bash
npm install
npm run dev
```

### Build For Vercel

```bash
npm run build
```

### Optional Environment Variables

To load listings from Airtable and enable Hack Club auth, set:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_LISTINGS_TABLE` (defaults to `Listings`)
- `AIRTABLE_USERS_TABLE` (defaults to `Hack Club Users`)
- `HACKCLUB_CLIENT_ID`
- `HACKCLUB_CLIENT_SECRET`
- `HACKCLUB_AUTH_HOST` (defaults to Hack Club auth in production and the Stardance dev host locally)
- `SESSION_SECRET`

The front end falls back to `listings.json` if Airtable is not configured.
