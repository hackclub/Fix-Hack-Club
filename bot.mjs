/**
 * Mergeus — Pullquests Slack ticket bot (Socket Mode)
 *
 * Opens a support ticket for every new top-level message in the help channel,
 * notifies the support team, and lets support resolve it with a button or the
 * /close (alias /bye) command. No AI — purely ticket routing.
 *
 * Required env vars:
 *   SLACK_APP_TOKEN   xapp-… (App-Level Token with connections:write scope)
 *   SLACK_BOT_TOKEN   xoxb-… (Bot Token)
 *
 * Optional:
 *   SLACK_ADMIN_IDS   comma-separated Slack user IDs of support members who can
 *                     use the control-panel buttons and get pinged on new tickets
 */

import WebSocket from 'ws';

const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN ?? '';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN ?? '';

if (!SLACK_APP_TOKEN || !SLACK_BOT_TOKEN) {
  console.log('[bot] SLACK_APP_TOKEN or SLACK_BOT_TOKEN not set — skipping bot.');
  process.exit(0);
}

// Comma-separated Slack user IDs of support/admins (e.g. "U08J9R1TUT1,U012345").
const ADMIN_IDS = new Set(
  (process.env.SLACK_ADMIN_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

function adminMentions() {
  return [...ADMIN_IDS].map((id) => `<@${id}>`).join(' ');
}

// Mergeus only operates in this channel.
const ALLOWED_CHANNEL = 'C0B8CPJ3TT7';

// Hidden marker (wrapped in zero-width spaces) so a resolved ticket stays
// resolved across restarts — it lives in the Slack thread history.
const CLOSE_MARKER = '​[MERGEUS_CLOSED]​';
const closedThreads = new Set();

// Dedup: Slack can deliver the same message twice (e.g. on reconnect), so a
// given message only ever opens one ticket.
const seenEvents = new Set();
function alreadySeen(key) {
  if (!key) return false;
  if (seenEvents.has(key)) return true;
  seenEvents.add(key);
  if (seenEvents.size > 1000) {
    for (const k of [...seenEvents].slice(0, 500)) seenEvents.delete(k);
  }
  return false;
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

// ── Ticket actions ───────────────────────────────────────────────────────────

// Post the ticket panel as the first reply in the new ticket's thread. It
// acknowledges the member, asks for the details support needs, pings the
// support team, and includes a "Mark resolved" button.
async function openTicket(channel, threadTs, userId) {
  const pings = adminMentions();

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `🎫 *Ticket opened* — thanks <@${userId}>!\n` +
          'A support member has been notified. To help us resolve this faster, please reply in this thread with:\n' +
          '• Your name\n' +
          '• Your Hack Club email or Slack ID\n' +
          '• What you need help with (and any links — PR, project page, etc.)',
      },
    },
  ];

  if (pings) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `${pings} — a new ticket needs attention. 🆕` },
    });
  }

  blocks.push({
    type: 'actions',
    block_id: 'mergeus_controls',
    elements: [
      {
        type: 'button',
        action_id: 'mergeus_resolve',
        style: 'primary',
        text: { type: 'plain_text', text: '✅ Mark resolved' },
      },
    ],
  });

  await slackApi('chat.postMessage', {
    channel,
    thread_ts: threadTs,
    text: 'Ticket opened — support has been notified.', // notification fallback
    blocks,
  });
}

// Mark a ticket resolved with a visible note + hidden marker (persistent).
async function markClosed(channel, threadTs, visibleText) {
  closedThreads.add(threadTs);
  await slackApi('chat.postMessage', {
    channel,
    thread_ts: threadTs,
    text: `${visibleText}${CLOSE_MARKER}`,
  });
}

// Handle a click on the "Mark resolved" control-panel button.
async function handleInteractive(payload) {
  const action   = payload?.actions?.[0]?.action_id;
  const userId   = payload?.user?.id;
  const channel  = payload?.channel?.id;
  const panelTs  = payload?.message?.ts;
  const threadTs = payload?.message?.thread_ts ?? payload?.container?.thread_ts ?? panelTs;

  if (!action || !channel || !threadTs) return;
  if (channel !== ALLOWED_CHANNEL) return;

  // Only support/admins may resolve tickets (when admins are configured).
  if (ADMIN_IDS.size > 0 && !ADMIN_IDS.has(userId)) {
    await slackApi('chat.postEphemeral', {
      channel,
      user: userId,
      thread_ts: threadTs,
      text: 'Only support members can use these controls.',
    });
    return;
  }

  if (action === 'mergeus_resolve') {
    closedThreads.add(threadTs);
    const headline = `✅ *Resolved* by <@${userId}>. Thanks for using FixHC support! 🦕`;
    if (panelTs) {
      // Update the panel in place: show the outcome, drop the button, embed marker.
      await slackApi('chat.update', {
        channel,
        ts: panelTs,
        text: `${headline}${CLOSE_MARKER}`,
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: headline } }],
      });
    } else {
      await markClosed(channel, threadTs, headline);
    }
  }
}

// ── Event handler ──────────────────────────────────────────────────────────────

async function handleEvent(event) {
  // Only operate in the allowed channel.
  if (event.channel !== ALLOWED_CHANNEL) return;

  // Ignore bot messages (and our own) to prevent loops.
  if (event.bot_id || event.subtype === 'bot_message') return;

  // Only plain messages — ignore app_mention (delivered as a message too),
  // edits, joins, file-shares, etc.
  if (event.type !== 'message') return;
  if (event.subtype) return;

  // Never open the same ticket twice.
  if (alreadySeen(event.ts)) return;

  // Only NEW top-level messages open a ticket. Replies inside a ticket thread
  // are the conversation between the member and support — Mergeus stays out.
  if (event.thread_ts) return;

  const text = strip(event.text ?? '');
  if (!text) return;

  await openTicket(event.channel, event.ts, event.user);
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
      console.log('[bot] Handshake complete — ready for tickets');
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

    if (envelope.type === 'interactive') {
      const payload = envelope.payload;
      if (payload?.type === 'block_actions') {
        handleInteractive(payload).catch(err => console.error('[bot] interactive error:', err.message));
      }
    }

    if (envelope.type === 'slash_commands') {
      const cmd      = envelope.payload?.command;
      const threadTs = envelope.payload?.thread_ts;
      const channel  = envelope.payload?.channel_id;

      if ((cmd === '/bye' || cmd === '/close') && channel) {
        if (threadTs) {
          ws.send(JSON.stringify({ envelope_id: envelope.envelope_id, payload: {} }));
          markClosed(channel, threadTs, '✅ *Ticket closed.* Reopen by starting a new message.').catch(err =>
            console.error('[bot] markClosed error:', err.message),
          );
        } else {
          ws.send(JSON.stringify({
            envelope_id: envelope.envelope_id,
            payload: { text: 'Run `/close` from inside a ticket thread to resolve it.' },
          }));
        }
      }
    }
  });

  ws.on('error', err => console.error('[bot] WebSocket error:', err.message));

  ws.on('close', (code, reason) => {
    if (code === 1000) {
      setTimeout(connect, 500);
      return;
    }
    console.log(`[bot] Connection closed (${code} ${reason}) — reconnecting in ${retryDelay / 1000}s`);
    setTimeout(connect, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60_000);
  });
}

console.log('[bot] Starting Mergeus ticket bot…');
connect();
