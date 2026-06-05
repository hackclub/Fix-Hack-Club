/**
 * Pullquests Slack Bot — Socket Mode
 *
 * Connects to Slack over a persistent WebSocket (no inbound HTTP endpoint
 * needed). Started as a background process by docker-entrypoint.sh when
 * SLACK_APP_TOKEN, SLACK_BOT_TOKEN, and OPENROUTER_API_KEY are all set.
 *
 * Required env vars:
 *   SLACK_APP_TOKEN      xapp-… (App-Level Token with connections:write scope)
 *   SLACK_BOT_TOKEN      xoxb-… (Bot Token)
 *   OPENROUTER_API_KEY   sk-or-…
 *
 * Optional:
 *   OPENROUTER_MODEL     defaults to meta-llama/llama-3.3-70b-instruct:free
 *   APP_BASE_URL         sent as HTTP-Referer to OpenRouter
 */

import WebSocket from 'ws';

const SLACK_APP_TOKEN  = process.env.SLACK_APP_TOKEN  ?? '';
const SLACK_BOT_TOKEN  = process.env.SLACK_BOT_TOKEN  ?? '';
const OPENROUTER_KEY   = process.env.OPENROUTER_API_KEY ?? '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free';
const APP_BASE_URL     = process.env.APP_BASE_URL ?? 'https://fixhc.hackclub.com';

if (!SLACK_APP_TOKEN || !SLACK_BOT_TOKEN || !OPENROUTER_KEY) {
  console.log('[bot] SLACK_APP_TOKEN, SLACK_BOT_TOKEN or OPENROUTER_API_KEY not set — skipping bot.');
  process.exit(0);
}

// ── System prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are the FixHC Pullquests assistant — a friendly Slack bot that helps Hack Club members understand and participate in Pullquests (also known as FixHC).

## What is Pullquests / FixHC?
Pullquests is a Hack Club program where members submit merged pull requests to official Hack Club projects and earn points based on their logged coding time via Hackatime. Points can be redeemed in the FixHC shop for grants and rewards.

## Rules (important — share these when relevant)
- PRs *must be merged by a program manager* before submitting the form
- Contributions must be towards an *official Hack Club program*
- Both individual and club submissions are accepted

## How to participate
1. Browse open work at ${APP_BASE_URL}/find
2. Fork a repo, make your fix, open a PR, and get it merged
3. Connect Hackatime at ${APP_BASE_URL}/settings to track coding time
4. Submit your fix at ${APP_BASE_URL}/projects/submit (3-step wizard)
5. Post devlogs on your project page as you work
6. Click "Submit for review" when ready — an admin approves or rejects it

## Submission wizard steps
- *Step 1 – Info:* First/last name, email, GitHub username, date of birth, Slack ID, submission type (Individual or Club Submission)
- *Step 2 – PR:* Project title, merged PR URL, repo, linked Hackatime project, category
- *Step 3 – Submission:* Review and submit (created as a Draft — admins won't see it until you click "Submit for review")

## Points system
- 1 point per hour of Hackatime-tracked coding time at 0.1 precision (30 min = 0.5 pts)
- Points are pending until an admin approves your submission
- View your balance and full activity at ${APP_BASE_URL}/account

## Review workflow
- New fixes start as a *Draft* (private)
- Click "Submit for review" on your project page to enter the review queue
- Admin will *Approve* (points awarded) or *Reject* (with a reason shown to you)
- If rejected, address the feedback and click "Submit for review again"

## Common rejection reasons
- Not sufficient changes
- Waiting on PR to be merged — must merge first!
- Out of scope — not an official Hack Club project
- Needs more detail in the devlog or notes
- Doesn't follow the contribution guidelines

## Shop & grants
Spend points at ${APP_BASE_URL}/shop. Redemption collects:
- Grant type: Food Grant / Other
- Fulfilment: HCB Organization / Digital Card / Reimbursement
- Shipping address

## Getting a repo listed on Find work
DM Elias on Slack: https://hackclub.enterprise.slack.com/team/U08J9R1TUT1

---

## Your behaviour
- Answer questions accurately. Keep responses concise and Slack-friendly — use *bold* (not **bold**), _italics_, and line breaks.
- Link to the relevant page when useful.
- If someone has an issue needing a human (submission dispute, technical bug, something you can't resolve), gather these details first:
  1. Their name
  2. Their Hack Club email or Slack ID
  3. The specific issue + any relevant URLs (PR link, project page, etc.)
  Once you have all three, write a clear one-paragraph summary and tell them to DM Elias at https://hackclub.enterprise.slack.com/team/U08J9R1TUT1 or post in #pull-quests with the summary.
- Stay on-topic. Politely decline questions unrelated to Pullquests / FixHC.
- If you genuinely don't know something, say so and suggest reaching out to a human.
`;

// ── OpenRouter ─────────────────────────────────────────────────────────────────

async function chat(history, userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_BASE_URL,
      'X-Title': 'FixHC Pullquests Bot',
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: 900 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${txt}`);
  }
  const data = await res.json();
  if (data.error?.message) throw new Error(`OpenRouter: ${data.error.message}`);
  return data.choices?.[0]?.message?.content?.trim()
    ?? "I'm having trouble responding right now. Please ask in #pull-quests.";
}

// ── Slack API helpers ──────────────────────────────────────────────────────────

async function slackApi(method, body) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

function strip(text) {
  return (text ?? '').replace(/<@[A-Z0-9]+>/g, '').trim();
}

let cachedBotId = '';
async function getBotId() {
  if (cachedBotId) return cachedBotId;
  const d = await slackApi('auth.test', {});
  cachedBotId = d.user_id ?? '';
  return cachedBotId;
}

async function getHistory(channel, threadTs, botId) {
  const d = await slackApi('conversations.replies', { channel, ts: threadTs, limit: 20 });
  if (!d.ok || !Array.isArray(d.messages)) return [];
  return d.messages
    .slice(0, -1)
    .map(m => ({
      role: (m.bot_id || m.user === botId) ? 'assistant' : 'user',
      content: strip(m.text ?? ''),
    }))
    .filter(m => m.content.length > 0);
}

// ── Event handler ──────────────────────────────────────────────────────────────

async function handleEvent(event) {
  // Only respond to DMs and @mentions; ignore bot messages to prevent loops.
  const isDM      = event.type === 'message' && event.channel_type === 'im';
  const isMention = event.type === 'app_mention';
  if ((!isDM && !isMention) || event.bot_id || event.subtype === 'bot_message') return;

  const threadTs = event.thread_ts ?? event.ts;
  const text = strip(event.text ?? '');

  if (!text) {
    await slackApi('chat.postMessage', {
      channel: event.channel,
      thread_ts: threadTs,
      text: "Hey! I'm the FixHC Pullquests bot 👋 Ask me anything about submitting fixes, earning points, or the shop.",
    });
    return;
  }

  const botId  = await getBotId();
  const history = event.thread_ts
    ? await getHistory(event.channel, event.thread_ts, botId)
    : [];

  const reply = await chat(history, text);

  await slackApi('chat.postMessage', {
    channel: event.channel,
    thread_ts: threadTs,
    text: reply,
  });
}

// ── Socket Mode connection ─────────────────────────────────────────────────────

async function openConnection() {
  const res = await fetch('https://slack.com/api/apps.connections.open', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SLACK_APP_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`apps.connections.open: ${data.error}`);
  return data.url;
}

let retryDelay = 2000;

async function connect() {
  let url;
  try {
    url = await openConnection();
  } catch (err) {
    console.error(`[bot] Could not get WSS URL: ${err.message} — retrying in ${retryDelay / 1000}s`);
    setTimeout(connect, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60_000);
    return;
  }

  retryDelay = 2000; // reset on successful open
  const ws = new WebSocket(url);

  ws.on('open', () => console.log('[bot] Connected to Slack via Socket Mode'));

  ws.on('message', rawData => {
    let envelope;
    try { envelope = JSON.parse(rawData.toString()); } catch { return; }

    // ACK every envelope immediately so Slack doesn't time out.
    if (envelope.envelope_id) {
      ws.send(JSON.stringify({ envelope_id: envelope.envelope_id }));
    }

    if (envelope.type === 'hello') {
      console.log('[bot] Handshake complete — ready for events');
      return;
    }

    if (envelope.type === 'disconnect') {
      console.log(`[bot] Slack requested disconnect (${envelope.reason ?? '—'}), reconnecting…`);
      ws.close(1000, 'disconnect requested');
      return;
    }

    if (envelope.type === 'events_api') {
      const event = envelope.payload?.event;
      if (event) {
        handleEvent(event).catch(err => console.error('[bot] event error:', err.message));
      }
    }
  });

  ws.on('error', err => console.error('[bot] WebSocket error:', err.message));

  ws.on('close', (code, reason) => {
    if (code === 1000) {
      // Clean close triggered by disconnect event — reconnect immediately.
      setTimeout(connect, 500);
      return;
    }
    console.log(`[bot] Connection closed (${code} ${reason}) — reconnecting in ${retryDelay / 1000}s`);
    setTimeout(connect, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60_000);
  });
}

console.log('[bot] Starting Pullquests Slack bot…');
connect();
