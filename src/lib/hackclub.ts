import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from './config';
import type { HackClubProfile } from './types';

interface TokenResponse {
  access_token?: string;
  token?: string;
}

export function getRedirectUri(origin: string): string {
  return `${origin}/api/auth/callback`;
}

export function buildAuthUrl({
  origin,
  state,
  loginHint,
}: {
  origin: string;
  state?: string;
  loginHint?: string;
}): string {
  if (!config.authClientId) {
    throw new Error('HACKCLUB_CLIENT_ID is not configured');
  }

  const url = new URL('/oauth/authorize', config.authHost);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.authClientId);
  url.searchParams.set('redirect_uri', getRedirectUri(origin));
  url.searchParams.set('scope', config.authScope);

  if (state) {
    url.searchParams.set('state', state);
  }

  if (loginHint) {
    url.searchParams.set('login_hint', loginHint);
  }

  return url.toString();
}

export function createState(): string {
  return randomUUID();
}

export async function exchangeCodeForToken({
  code,
  origin,
}: {
  code: string;
  origin: string;
}): Promise<TokenResponse> {
  const response = await fetch(new URL('/oauth/token', config.authHost), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.authClientId,
      client_secret: config.authClientSecret,
      redirect_uri: getRedirectUri(origin),
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed with status ${response.status}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function fetchHackClubProfile(
  accessToken: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(new URL('/api/v1/me', config.authHost), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Hack Club profile request failed with status ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export function normalizeHackClubProfile(
  payload: Record<string, unknown>,
): HackClubProfile {
  const identity = (payload?.identity ?? {}) as Record<string, unknown>;
  const str = (value: unknown): string => (value == null ? '' : String(value));

  return {
    id: str(identity.id) || str(payload?.id),
    email:
      str(identity.primary_email).toLowerCase() || str(payload?.email).toLowerCase(),
    first_name: str(identity.first_name) || str(payload?.first_name),
    last_name: str(identity.last_name) || str(payload?.last_name),
    display_name:
      str(identity.display_name) ||
      str(identity.first_name) ||
      str(payload?.name) ||
      str(payload?.email) ||
      'Hack Club member',
    slack_id: str(identity.slack_id) || str(payload?.slack_id),
    verification_status:
      str(identity.verification_status) || str(payload?.verification_status),
    avatar: str(identity.avatar_url) || str(payload?.avatar_url),
  };
}

function sign(value: string): string {
  return createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

export function createSessionValue(profile: HackClubProfile): string {
  const payload = Buffer.from(JSON.stringify(profile)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSessionValue(
  value: string | undefined | null,
): HackClubProfile | null {
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

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as HackClubProfile;
  } catch {
    return null;
  }
}
