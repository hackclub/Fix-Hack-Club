// Implemented as a getter so the validation fires at first access (a real
// incoming request), not when the module is imported at `next build` time.
// Next.js runs with NODE_ENV=production during the build phase but doesn't
// inject runtime secrets, so a module-level throw would break the build.
function runtimeSecret(envVar: string, devFallback: string): () => string {
  return () => {
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
  };
}

const _sessionSecret = runtimeSecret('SESSION_SECRET', 'fixhc-dev-secret');

// Note: `as const` is intentionally omitted — TypeScript does not allow it
// on object literals that contain getters.  All fields are still typed as
// their concrete string types; the object is effectively immutable in practice
// since it is a module-level constant.
export const config = {
  authHost: process.env.HACKCLUB_AUTH_HOST || 'https://auth.hackclub.com',
  authClientId: process.env.HACKCLUB_CLIENT_ID || '',
  authClientSecret: process.env.HACKCLUB_CLIENT_SECRET || '',
  authScope:
    process.env.HACKCLUB_AUTH_SCOPE ||
    'openid email name profile verification_status slack_id',
  get sessionSecret(): string { return _sessionSecret(); },
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
};
