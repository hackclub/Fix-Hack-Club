# Pullquests Slack Bot — Setup Guide

The bot lives at `/api/slack/events` and responds to DMs and @mentions using
OpenRouter (Claude) with full knowledge of the Pullquests program.

---

## 1. Create the Slack app

1. Go to https://api.slack.com/apps → **Create New App → From scratch**
2. Name it **"Pullquests Bot"**, pick the Hack Club workspace
3. Under **OAuth & Permissions → Bot Token Scopes**, add:
   - `app_mentions:read`
   - `chat:write`
   - `im:history`
   - `im:write`
   - `channels:history` *(only if you want it to read threads in public channels)*
4. Install the app to your workspace → copy the **Bot User OAuth Token** (`xoxb-…`)

## 2. Enable Events

1. **Event Subscriptions → Enable Events**
2. Request URL: `https://YOUR_APP_BASE_URL/api/slack/events`
   Slack will send a `url_verification` challenge — the endpoint handles it automatically.
3. Subscribe to bot events:
   - `app_mention`
   - `message.im`

## 3. Get the Signing Secret

Settings → **Basic Information → Signing Secret** — copy it.

## 4. Set environment variables

Add to Render (or your `.env.local` for local dev):

```
SLACK_BOT_TOKEN=xoxb-…
SLACK_SIGNING_SECRET=…
OPENROUTER_API_KEY=sk-or-…
OPENROUTER_MODEL=anthropic/claude-3-haiku   # optional, this is the default
```

## 5. Invite the bot to channels

In Slack: `/invite @Pullquests Bot` in `#pull-quests` (and any other channels
you want it to respond to @mentions in).

---

## How the bot works

| Trigger | Behaviour |
|---|---|
| DM to the bot | Responds in a thread; maintains conversation context per thread |
| @mention in a channel | Responds in a thread under the mention |
| Slack retries | Silently acknowledged (no duplicate replies) |

The bot uses the thread history on each message to provide multi-turn context,
so follow-up questions work naturally.

### Escalation flow
When someone needs human help, the bot collects:
1. Their name
2. Their Hack Club email or Slack ID
3. The specific issue + relevant URLs

Then it gives them a clear summary and directs them to DM Elias or post in
`#pull-quests` with the summary.
