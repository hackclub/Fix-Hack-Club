import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getOrigin } from '@/lib/origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  const response = NextResponse.redirect(new URL('/', origin));

  for (const name of [config.sessionCookieName, config.oauthStateCookieName]) {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: origin.startsWith('https://'),
    });
  }

  return response;
}
