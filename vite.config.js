import { defineConfig, loadEnv } from 'vite';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';

const AIRTABLE_API = 'https://api.airtable.com/v0';
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const loadedEnv = loadEnv(mode, process.cwd(), '');
const authHost = loadedEnv.HACKCLUB_AUTH_HOST || 'https://auth.hackclub.com';
const authClientId = loadedEnv.HACKCLUB_CLIENT_ID || '';
const authClientSecret = loadedEnv.HACKCLUB_CLIENT_SECRET || '';
const authScope = loadedEnv.HACKCLUB_AUTH_SCOPE || 'openid email name profile verification_status slack_id';
const airtableApiKey = loadedEnv.AIRTABLE_API_KEY || '';
const airtableBaseId = loadedEnv.AIRTABLE_BASE_ID || '';
const airtableListingsTable = loadedEnv.AIRTABLE_LISTINGS_TABLE || 'Listings';
const airtableUsersTable = loadedEnv.AIRTABLE_USERS_TABLE || 'Hack Club Users';
const airtableSubmissionsTable = loadedEnv.AIRTABLE_SUBMISSIONS_TABLE || 'Submissions';
const sessionSecret = loadedEnv.SESSION_SECRET || 'fixhc-dev-secret';
const sessionCookieName = loadedEnv.SESSION_COOKIE_NAME || 'fixhc_session';
const oauthStateCookieName = loadedEnv.OAUTH_STATE_COOKIE_NAME || 'fixhc_oauth_state';

function getOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = forwardedHost || req.headers.host;
  const protocol = forwardedProto || 'https';

  return `${protocol}://${host}`;
}

function readCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, entry) => {
    const [name, ...valueParts] = entry.trim().split('=');

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join('='));
    return cookies;
  }, {});
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join('; ');
}

function json(res, statusCode, payload, headers = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.end(JSON.stringify(payload));
}

function redirect(res, location, statusCode = 302, headers = {}) {
  res.statusCode = statusCode;
  res.setHeader('Location', location);

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.end();
}

function createState() {
  return randomUUID();
}

function getRedirectUri(origin) {
  return `${origin}/api/auth/callback`;
}

function buildAuthUrl({ origin, state, loginHint } = {}) {
  const url = new URL('/oauth/authorize', authHost);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', authClientId);
  url.searchParams.set('redirect_uri', getRedirectUri(origin));
  url.searchParams.set('scope', authScope);

  if (state) {
    url.searchParams.set('state', state);
  }

  if (loginHint) {
    url.searchParams.set('login_hint', loginHint);
  }

  return url.toString();
}

async function exchangeCodeForToken({ code, origin }) {
  const response = await fetch(new URL('/oauth/token', authHost), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: authClientId,
      client_secret: authClientSecret,
      redirect_uri: getRedirectUri(origin),
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed with status ${response.status}`);
  }

  return response.json();
}

async function fetchHackClubProfile(accessToken) {
  const response = await fetch(new URL('/api/v1/me', authHost), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Hack Club profile request failed with status ${response.status}`);
  }

  return response.json();
}

function normalizeHackClubProfile(payload) {
  const identity = payload?.identity || {};

  return {
    id: identity.id?.toString() || payload?.id?.toString() || '',
    email: identity.primary_email?.toString().toLowerCase() || payload?.email?.toString().toLowerCase() || '',
    first_name: identity.first_name?.toString() || payload?.first_name?.toString() || '',
    last_name: identity.last_name?.toString() || payload?.last_name?.toString() || '',
    display_name: identity.display_name?.toString() || identity.first_name?.toString() || payload?.name?.toString() || payload?.email?.toString() || 'Hack Club member',
    slack_id: identity.slack_id?.toString() || payload?.slack_id?.toString() || '',
    verification_status: identity.verification_status?.toString() || payload?.verification_status?.toString() || '',
    avatar: identity.avatar_url?.toString() || payload?.avatar_url?.toString() || '',
  };
}

function sign(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

function createSessionValue(profile) {
  const payload = Buffer.from(JSON.stringify(profile)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readSessionValue(value) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);

  if (signature.length !== expected.length) {
    return null;
  }

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function airtableConfigured() {
  return Boolean(airtableApiKey && airtableBaseId);
}

async function fetchAirtableTable(tableName) {
  if (!airtableConfigured()) {
    throw new Error('Airtable is not configured');
  }

  const records = [];
  let offset;

  do {
    const url = new URL(`${AIRTABLE_API}/${airtableBaseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');

    if (offset) {
      url.searchParams.set('offset', offset);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Airtable request failed with status ${response.status}${body ? `: ${body}` : ''}`);
    }

    const payload = await response.json();
    records.push(...(payload.records || []));
    offset = payload.offset;
  } while (offset);

  return records;
}

function toRequirements(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(/\r?\n|\s*;\s*/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function normalizeListing(record, index) {
  const fields = record.fields || {};
  const title = fields.Title || fields.title || fields['Listing Title'] || fields.name || record.id || `Listing ${index + 1}`;
  const description = fields.Description || fields.description || '';
  const url = fields.URL || fields.url || fields['Page URL'] || fields.link || '';
  const githubUrl = fields['GitHub URL'] || fields.github_url || fields.github || fields.repo || '';
  const status = (fields.Status || fields.status || 'active').toString().toLowerCase();
  const completedAt = fields['Completed At'] || fields.completed_at || null;
  const requirements = toRequirements(fields.Requirements || fields.requirements || fields['Requirement'] || fields.notes);

  return {
    id: fields.ID || fields.id || record.id || `listing-${index + 1}`,
    title,
    description,
    requirements,
    url,
    github_url: githubUrl,
    status: status === 'done' ? 'finished' : status,
    completed_at: completedAt,
  };
}

function normalizeSubmission(record) {
  const fields = record.fields || {};

  return {
    id: record.id,
    title: fields.Title || fields.title || 'Untitled submission',
    url: fields.URL || fields.url || fields.Link || fields.link || '',
    repo: fields.Repo || fields.repo || fields['Repository'] || '',
    category: fields.Category || fields.category || 'Other',
    notes: fields.Notes || fields.notes || '',
    status: fields.Status || fields.status || 'Submitted',
    created_at: fields['Created At'] || fields.created_at || record.createdTime || null,
  };
}

async function fetchUserSubmissions(user) {
  if (!airtableConfigured()) {
    throw new Error('Airtable is not configured');
  }

  const records = await fetchAirtableTable(airtableSubmissionsTable);
  const identityValues = new Set([user?.id, user?.email].filter(Boolean).map(String));

  return records
    .filter((record) => {
      const fields = record.fields || {};
      return identityValues.has(String(fields['Hack Club ID'] || fields.hack_club_id || '')) ||
        identityValues.has(String(fields.Email || fields.email || ''));
    })
    .sort((left, right) => {
      const leftTime = new Date(left.createdTime || left.fields?.['Created At'] || 0).getTime();
      const rightTime = new Date(right.createdTime || right.fields?.['Created At'] || 0).getTime();
      return rightTime - leftTime;
    })
    .map(normalizeSubmission);
}

async function createSubmission(user, payload) {
  if (!airtableConfigured()) {
    throw new Error('Airtable is not configured');
  }

  const fields = {
    Title: payload.title,
    URL: payload.url,
    Repo: payload.repo,
    Category: payload.category || 'Other',
    Notes: payload.notes || '',
    Status: 'Submitted',
    'Hack Club ID': user?.id || '',
    Email: user?.email || '',
    'Display Name': user?.display_name || '',
    'Created At': new Date().toISOString(),
  };

  const response = await fetch(`${AIRTABLE_API}/${airtableBaseId}/${encodeURIComponent(airtableSubmissionsTable)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Submission create failed with status ${response.status}${body ? `: ${body}` : ''}`);
  }

  return response.json();
}

function getListingsResponse() {
  return fetchAirtableTable(airtableListingsTable)
    .then((records) => {
      const listings = records
        .sort((left, right) => {
          const leftFields = left.fields || {};
          const rightFields = right.fields || {};
          const leftRank = Number(leftFields.Priority || leftFields.priority || leftFields['Sort Order'] || leftFields.sort_order || 0);
          const rightRank = Number(rightFields.Priority || rightFields.priority || rightFields['Sort Order'] || rightFields.sort_order || 0);
          return leftRank - rightRank;
        })
        .map(normalizeListing);

      return { listings };
    })
    .catch((error) => ({
      error: 'Failed to load Airtable listings',
      message: error.message,
      listings: [],
    }));
}

async function upsertAirtableRecord(tableName, matches, fields) {
  if (!airtableConfigured()) {
    return null;
  }

  const records = await fetchAirtableTable(tableName);
  const existing = records.find((record) =>
    matches.some((matcher) => record.fields?.[matcher.field] === matcher.value)
  );

  const path = existing
    ? `${AIRTABLE_API}/${airtableBaseId}/${encodeURIComponent(tableName)}/${existing.id}`
    : `${AIRTABLE_API}/${airtableBaseId}/${encodeURIComponent(tableName)}`;

  const response = await fetch(path, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable upsert failed with status ${response.status}${body ? `: ${body}` : ''}`);
  }

  return response.json();
}

function userFields(profile) {
  return {
    'Hack Club ID': profile.id,
    Email: profile.email,
    'Display Name': profile.display_name,
    'First Name': profile.first_name,
    'Last Name': profile.last_name,
    'Slack ID': profile.slack_id,
    'Verification Status': profile.verification_status,
    Avatar: profile.avatar,
    'Last Signed In At': new Date().toISOString(),
  };
}

function setSessionCookie(res, profile, origin) {
  const sessionCookie = buildCookie(sessionCookieName, createSessionValue(profile), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'Lax',
    secure: origin.startsWith('https://'),
  });

  res.setHeader('Set-Cookie', sessionCookie);
}

function clearCookie(name, origin) {
  return buildCookie(name, '', {
    path: '/',
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'Lax',
    secure: origin.startsWith('https://'),
  });
}

export default defineConfig({
  envDir: '.',
  envPrefix: 'HACKCLUB_',
  define: {
    'process.env.AIRTABLE_API_KEY': JSON.stringify(process.env.AIRTABLE_API_KEY || ''),
    'process.env.AIRTABLE_BASE_ID': JSON.stringify(process.env.AIRTABLE_BASE_ID || ''),
    'process.env.AIRTABLE_LISTINGS_TABLE': JSON.stringify(process.env.AIRTABLE_LISTINGS_TABLE || 'Listings'),
    'process.env.AIRTABLE_USERS_TABLE': JSON.stringify(process.env.AIRTABLE_USERS_TABLE || 'Hack Club Users'),
    'process.env.SESSION_SECRET': JSON.stringify(process.env.SESSION_SECRET || 'fixhc-dev-secret'),
    'process.env.SESSION_COOKIE_NAME': JSON.stringify(process.env.SESSION_COOKIE_NAME || 'fixhc_session'),
    'process.env.OAUTH_STATE_COOKIE_NAME': JSON.stringify(process.env.OAUTH_STATE_COOKIE_NAME || 'fixhc_oauth_state'),
  },
  server: {
    host: true,
  },
  plugins: [
    {
      name: 'fixhc-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url || '/', getOrigin(req));

          if (url.pathname === '/api/listings') {
            const payload = await getListingsResponse();
            json(res, payload.error ? 500 : 200, payload);
            return;
          }

          if (url.pathname === '/api/auth/me') {
            const cookies = readCookies(req.headers.cookie || '');
            const user = readSessionValue(cookies[sessionCookieName]);
            json(res, 200, { signedIn: Boolean(user), user: user || null });
            return;
          }

          if (url.pathname === '/api/auth/logout') {
            redirect(res, '/#top', 302, {
              'Set-Cookie': [clearCookie(sessionCookieName, getOrigin(req)), clearCookie(oauthStateCookieName, getOrigin(req))],
            });
            return;
          }

          if (url.pathname === '/api/auth/start') {
            const origin = getOrigin(req);
            const state = createState();
            const loginHint = url.searchParams.get('login_hint') || '';
            const authUrl = buildAuthUrl({ origin, state, loginHint });

            redirect(res, authUrl, 302, {
              'Set-Cookie': buildCookie(oauthStateCookieName, state, {
                path: '/',
                maxAge: 10 * 60,
                httpOnly: true,
                sameSite: 'Lax',
                secure: origin.startsWith('https://'),
              }),
            });
            return;
          }

          if (url.pathname === '/api/auth/callback') {
            const origin = getOrigin(req);
            const cookies = readCookies(req.headers.cookie || '');
            const state = url.searchParams.get('state') || '';
            const code = url.searchParams.get('code') || '';
            const storedState = cookies[oauthStateCookieName] || '';

            if (!code) {
              json(res, 400, { error: 'Missing OAuth code' });
              return;
            }

            if (!state || !storedState || state !== storedState) {
              json(res, 400, { error: 'OAuth state mismatch' });
              return;
            }

            try {
              const tokenResponse = await exchangeCodeForToken({ code, origin });
              const profilePayload = await fetchHackClubProfile(tokenResponse.access_token || tokenResponse.token || '');
              const profile = normalizeHackClubProfile(profilePayload);

              if (!profile.id) {
                throw new Error('Hack Club profile did not include an identity id');
              }

              if (airtableConfigured()) {
                await upsertAirtableRecord(
                  airtableUsersTable,
                  [
                    { field: 'Hack Club ID', value: profile.id },
                    { field: 'Email', value: profile.email },
                  ],
                  userFields(profile)
                );
              }

              const sessionCookie = buildCookie(sessionCookieName, createSessionValue(profile), {
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
                httpOnly: true,
                sameSite: 'Lax',
                secure: origin.startsWith('https://'),
              });

              const stateCookie = clearCookie(oauthStateCookieName, origin);

              redirect(res, '/#account', 302, {
                'Set-Cookie': [stateCookie, sessionCookie],
              });
            } catch (error) {
              json(res, 500, {
                error: 'Hack Club authentication failed',
                message: error.message,
              });
            }
            return;
          }

          if (url.pathname === '/api/submissions') {
            const cookies = readCookies(req.headers.cookie || '');
            const user = readSessionValue(cookies[sessionCookieName]);

            if (!user) {
              json(res, 401, { error: 'Unauthorized', message: 'Sign in to submit' });
              return;
            }

            if (req.method === 'GET') {
              try {
                const submissions = await fetchUserSubmissions(user);
                json(res, 200, { submissions });
              } catch (error) {
                json(res, 500, { error: 'Unable to load submissions', message: error.message, submissions: [] });
              }
              return;
            }

            if (req.method === 'POST') {
              try {
                const body = await new Promise((resolve, reject) => {
                  let data = '';
                  req.on('data', (chunk) => {
                    data += chunk;
                  });
                  req.on('end', () => {
                    try {
                      resolve(JSON.parse(data || '{}'));
                    } catch (error) {
                      reject(error);
                    }
                  });
                  req.on('error', reject);
                });

                if (!body.title || !body.url || !body.repo) {
                  json(res, 400, { error: 'Missing required fields', message: 'Title, URL, and repo are required.' });
                  return;
                }

                await createSubmission(user, body);
                json(res, 201, { ok: true });
              } catch (error) {
                json(res, 500, { error: 'Unable to submit', message: error.message });
              }
              return;
            }

            json(res, 405, { error: 'Method not allowed' });
            return;
          }

          next();
        });
      },
    },
  ],
});