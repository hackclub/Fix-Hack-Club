import type { NextRequest } from 'next/server';

// Resolve the public origin behind a TLS-terminating proxy (Render, Vercel, etc.).
// request.nextUrl.origin can report http:// because the container receives plain
// HTTP from the proxy, which breaks OAuth redirect_uri matching. Prefer an explicit
// APP_BASE_URL, then the forwarded headers, then fall back to nextUrl.
export function getOrigin(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    // Reduce to scheme + host even if APP_BASE_URL accidentally includes a path
    // (e.g. the callback URL), otherwise the redirect_uri path gets duplicated.
    const raw = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
    try {
      return new URL(raw).origin;
    } catch {
      return configured.replace(/\/+$/, '');
    }
  }

  const forwardedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host');

  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const proto =
      (forwardedProto ? forwardedProto.split(',')[0].trim() : '') ||
      (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}
