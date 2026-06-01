export const config = {
  authHost: process.env.HACKCLUB_AUTH_HOST || 'https://auth.hackclub.com',
  authClientId: process.env.HACKCLUB_CLIENT_ID || '',
  authClientSecret: process.env.HACKCLUB_CLIENT_SECRET || '',
  authScope:
    process.env.HACKCLUB_AUTH_SCOPE ||
    'openid email name profile verification_status slack_id',
  sessionSecret: process.env.SESSION_SECRET || 'fixhc-dev-secret',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'fixhc_session',
  oauthStateCookieName: process.env.OAUTH_STATE_COOKIE_NAME || 'fixhc_oauth_state',
} as const;
