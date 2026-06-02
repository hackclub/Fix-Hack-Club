// Guard for secrets that must be set in production.
// In development, a fallback value is accepted so `npm run dev` works out of
// the box without a full .env file. In production the server will refuse to
// start rather than silently use a weak or shared secret.
function requireSecret(envVar: string, devFallback: string): string {
  const value = process.env[envVar];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Environment variable ${envVar} is required in production but is not set. ` +
          'Set it in your deployment environment before starting the server.',
      );
    }
    return devFallback;
  }
  return value;
}

export const config = {
  authHost: process.env.HACKCLUB_AUTH_HOST || 'https://auth.hackclub.com',
  authClientId: process.env.HACKCLUB_CLIENT_ID || '',
  authClientSecret: process.env.HACKCLUB_CLIENT_SECRET || '',
  authScope:
    process.env.HACKCLUB_AUTH_SCOPE ||
    'openid email name profile verification_status slack_id',
  sessionSecret: requireSecret('SESSION_SECRET', 'fixhc-dev-secret'),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'fixhc_session',
  oauthStateCookieName: process.env.OAUTH_STATE_COOKIE_NAME || 'fixhc_oauth_state',
  hackatimeAuthHost: process.env.HACKATIME_AUTH_HOST || 'https://hackatime.hackclub.com',
  hackatimeClientId: process.env.HACKATIME_CLIENT_ID || '',
  hackatimeClientSecret: process.env.HACKATIME_CLIENT_SECRET || '',
  hackatimeStateCookieName: process.env.HACKATIME_STATE_COOKIE_NAME || 'fixhc_hackatime_state',
  hackatimeBypassKeys: process.env.HACKATIME_BYPASS_KEYS || '',
  // Fixed epoch so stats are a stable running total (not a rolling window),
  // which keeps devlog deltas / accumulated time correct.
  hackatimeStartDate: process.env.HACKATIME_START_DATE || '2026-01-01',
} as const;
