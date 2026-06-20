import { config } from './config';

const API = `${config.hackatimeAuthHost}/api/v1`;
const EXCLUDED_PROJECTS = new Set(['Other', '<<LAST_PROJECT>>']);

export interface HackatimeProjectStat {
  name: string;
  seconds: number;
}

export function getHackatimeRedirectUri(origin: string): string {
  return `${origin}/api/hackatime/callback`;
}

export function buildHackatimeAuthUrl({ origin, state }: { origin: string; state: string }): string {
  if (!config.hackatimeClientId) {
    throw new Error('HACKATIME_CLIENT_ID is not configured');
  }
  const url = new URL('/oauth/authorize', config.hackatimeAuthHost);
  url.searchParams.set('client_id', config.hackatimeClientId);
  url.searchParams.set('redirect_uri', getHackatimeRedirectUri(origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeHackatimeCode({
  code,
  origin,
}: {
  code: string;
  origin: string;
}): Promise<{ access_token?: string }> {
  const response = await fetch(`${config.hackatimeAuthHost}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.hackatimeClientId,
      client_secret: config.hackatimeClientSecret,
      code,
      redirect_uri: getHackatimeRedirectUri(origin),
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) {
    throw new Error(`Hackatime token exchange failed with status ${response.status}`);
  }
  return (await response.json()) as { access_token?: string };
}

function authHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'FixHC',
  };
  if (config.hackatimeBypassKeys) {
    headers['RACK_ATTACK_BYPASS'] = config.hackatimeBypassKeys;
  }
  return headers;
}

export async function fetchHackatimeMe(token: string): Promise<{ id: string | null; username: string | null }> {
  const response = await fetch(`${API}/authenticated/me`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Hackatime /authenticated/me failed: ${response.status}`);
  }
  const data = (await response.json()) as Record<string, unknown>;
  const id = data?.id != null ? String(data.id) : null;
  const username = data?.username != null ? String(data.username) : null;
  return { id, username };
}

export async function fetchHackatimeProjects(token: string): Promise<HackatimeProjectStat[]> {
  if (!token) return [];
  const response = await fetch(`${API}/authenticated/projects`, {
    headers: authHeaders(token),
  });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    projects?: Array<{ name?: string; total_seconds?: number; archived?: boolean }>;
  };
  const projects = data?.projects ?? [];
  return projects
    .filter((p) => p?.name && !p.archived && !EXCLUDED_PROJECTS.has(p.name) && Number(p.total_seconds) > 0)
    .map((p) => ({ name: String(p.name), seconds: Number(p.total_seconds) || 0 }))
    .sort((a, b) => b.seconds - a.seconds);
}

export async function fetchHackatimeProjectSeconds(
  uid: string,
  token: string,
  projectName: string,
): Promise<number> {
  if (!uid || !token || !projectName) return 0;
  const url = new URL(`${API}/users/${encodeURIComponent(uid)}/stats`);
  url.searchParams.set('features', 'projects');
  url.searchParams.set('start_date', config.hackatimeStartDate);
  url.searchParams.set('total_seconds', 'true');
  url.searchParams.set('filter_by_project', projectName);
  const response = await fetch(url, { headers: authHeaders(token) });
  if (!response.ok) return 0;
  const data = (await response.json()) as { total_seconds?: number };
  return Number(data?.total_seconds) || 0;
}

export function secondsToPoints(seconds: number): number {
  return Math.floor(((seconds || 0) / 3600) * 10) / 10;
}

export function secondsToHours(seconds: number): number {
  return Math.round(((seconds || 0) / 3600) * 10) / 10;
}

export function formatPoints(value: number): string {
  const rounded = Math.round((value || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
