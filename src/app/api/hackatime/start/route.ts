import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { buildHackatimeAuthUrl } from '@/lib/hackatime';
import { createState } from '@/lib/hackclub';
import { getOrigin } from '@/lib/origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  const state = createState();
  const authUrl = buildHackatimeAuthUrl({ origin, state });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(config.hackatimeStateCookieName, state, {
    path: '/',
    maxAge: 10 * 60,
    httpOnly: true,
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
  });
  return response;
}
