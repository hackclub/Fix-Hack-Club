import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { exchangeHackatimeCode, fetchHackatimeMe, fetchHackatimeProjects } from '@/lib/hackatime';
import { getOrigin } from '@/lib/origin';
import { getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  const profile = await getSessionProfile();

  // Linking attaches Hackatime to the currently signed-in FixHC user.
  if (!profile) {
    return NextResponse.redirect(new URL('/dashboard', origin));
  }

  if (request.nextUrl.searchParams.get('error')) {
    return NextResponse.redirect(new URL('/settings?hackatime=denied', origin));
  }

  const code = request.nextUrl.searchParams.get('code') || '';
  const state = request.nextUrl.searchParams.get('state') || '';
  const storedState = request.cookies.get(config.hackatimeStateCookieName)?.value || '';

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/settings?hackatime=error', origin));
  }

  try {
    const token = await exchangeHackatimeCode({ code, origin });
    const me = await fetchHackatimeMe(token.access_token || '');
    if (!me.id) {
      throw new Error('Hackatime did not return a user id');
    }

    const projects = await fetchHackatimeProjects(token.access_token || '');
    const seconds = projects.reduce((sum, p) => sum + p.seconds, 0);

    await prisma.user.update({
      where: { hackClubId: profile.id },
      data: {
        hackatimeUserId: me.id,
        hackatimeUsername: me.username,
        hackatimeToken: token.access_token || null,
        hackatimeSeconds: seconds,
        hackatimeSyncedAt: new Date(),
        hackatimeConnectedAt: new Date(),
      },
    });

    const response = NextResponse.redirect(new URL('/settings?hackatime=connected', origin));
    response.cookies.set(config.hackatimeStateCookieName, '', { path: '/', maxAge: 0 });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/settings?hackatime=error', origin));
  }
}
