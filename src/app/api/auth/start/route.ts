import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { buildAuthUrl, createState } from '@/lib/hackclub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const state = createState();
  const loginHint = request.nextUrl.searchParams.get('login_hint') || '';
  const authUrl = buildAuthUrl({ origin, state, loginHint });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(config.oauthStateCookieName, state, {
    path: '/',
    maxAge: 10 * 60,
    httpOnly: true,
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
  });

  return response;
}
