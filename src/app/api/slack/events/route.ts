import { createHmac, timingSafeEqual } from 'node:crypto';
import { type NextRequest } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------- Slack signature verification ----------

function verifySlackSignature(signingSecret: string, body: string, timestamp: string, signature: string): boolean {
  // Reject requests older than 5 minutes to prevent replay attacks.
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false;

  const base = `v0:${timestamp}:${body}`;
  const expected = `v0=${createHmac('sha256', signingSecret).update(base).digest('hex')}`;

  try {
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ---------- Slack API helpers ----------

async function slackPost(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

// Post a message, always in a thread so conversations stay tidy.
async function postReply(token: string, channel: string, threadTs: string, text: string) {
  await slackPost(token, 'chat.postMessage', { channel, thread_ts: threadTs, text });
}

// Fetch the thread history and convert to OpenRouter message format.
async function buildHistory(
  token: string,
  channel: string,
  threadTs: string,
  botUserId: string,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const data = (await slackPost(token, 'conversations.replies', {
    channel,
    ts: threadTs,
    limit: 20,
  })) as { ok?: boolean; messages?: Array<{ text?: string; user?: string; bot_id?: string }> };

  if (!data.ok || !Array.isArray(data.messages)) return [];

  return data.messages
    .slice(0, -1) // exclude the latest message (we're about to add it as the user turn)
    .map((msg) => ({
      role: (msg.bot_id || msg.user === botUserId ? 'assistant' : 'user') as 'user' | 'assistant',
      content: stripMentions(msg.text ?? ''),
    }))
    .filter((m) => m.content.length > 0);
}

// Resolve the bot's own user ID (cached for the container lifetime).
let cachedBotUserId = '';
async function getBotUserId(token: string): Promise<string> {
  if (cachedBotUserId) return cachedBotUserId;
  const data = (await slackPost(token, 'auth.test', {})) as { user_id?: string };
  cachedBotUserId = data.user_id ?? '';
  return cachedBotUserId;
}

function stripMentions(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, '').trim();
}

// ---------- Core event handler ----------

interface SlackEvent {
  type: string;
  channel: string;
  channel_type?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
  user?: string;
}

async function handleEvent(event: SlackEvent) {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!botToken || !openrouterKey) {
    console.warn('[slack-bot] SLACK_BOT_TOKEN or OPENROUTER_API_KEY not set — skipping');
    return;
  }

  // The "root" of the thread: reply to the originating message so the
  // conversation stays in one thread rather than flooding the channel.
  const threadTs = event.thread_ts ?? event.ts;
  const text = stripMentions(event.text ?? '');

  if (!text) {
    await postReply(botToken, event.channel, threadTs,
      "Hey! I'm the FixHC Pullquests bot. Ask me anything about submitting fixes, earning points, or using the shop.");
    return;
  }

  // Build conversation context from the existing thread.
  const botUserId = await getBotUserId(botToken);
  const history = event.thread_ts
    ? await buildHistory(botToken, event.channel, event.thread_ts, botUserId)
    : [];

  // Call OpenRouter.
  const reply = await chatCompletion(openrouterKey, history, text);

  // Send the reply.
  await postReply(botToken, event.channel, threadTs, reply);
}

// ---------- Route handler ----------

export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET ?? '';

  const body = await req.text();
  const timestamp = req.headers.get('X-Slack-Request-Timestamp') ?? '';
  const signature = req.headers.get('X-Slack-Signature') ?? '';

  // Verify that the request is genuinely from Slack.
  if (signingSecret && !verifySlackSignature(signingSecret, body, timestamp, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Skip retries — Slack resends if we don't respond fast enough, but we
  // don't want to post duplicate replies.
  if (req.headers.get('X-Slack-Retry-Num')) {
    return new Response('', { status: 200 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // Step 1: URL verification challenge (first-time Slack app setup).
  if (payload.type === 'url_verification') {
    return Response.json({ challenge: payload.challenge });
  }

  const event = payload.event as SlackEvent | undefined;
  if (!event) return new Response('', { status: 200 });

  // Ignore our own messages and system messages to prevent feedback loops.
  if (event.bot_id || event.subtype === 'bot_message' || event.type === 'message_changed') {
    return new Response('', { status: 200 });
  }

  // Only respond to:
  //   • Direct messages to the bot (channel_type === 'im')
  //   • @mentions in channels (type === 'app_mention')
  const isDM = event.type === 'message' && event.channel_type === 'im';
  const isMention = event.type === 'app_mention';
  if (!isDM && !isMention) {
    return new Response('', { status: 200 });
  }

  // Acknowledge Slack immediately (must be within 3 s).
  // handleEvent runs asynchronously in the background — safe in a Node.js
  // container (Render Docker) where the process outlives the HTTP response.
  void handleEvent(event).catch((err) => console.error('[slack-bot] handleEvent error:', err));

  return new Response('', { status: 200 });
}
