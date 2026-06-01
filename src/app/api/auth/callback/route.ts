import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import {
  createSessionValue,
  exchangeCodeForToken,
  fetchHackClubProfile,
  normalizeHackClubProfile,
} from '@/lib/hackclub';
import type { HackClubProfile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function upsertUser(profile: HackClubProfile) {
  const data = {
    email: profile.email || null,
    displayName: profile.display_name || null,
    firstName: profile.first_name || null,
    lastName: profile.last_name || null,
    slackId: profile.slack_id || null,
    verificationStatus: profile.verification_status || null,
    avatar: profile.avatar || null,
    lastSignedInAt: new Date(),
  };

  await prisma.user.upsert({
    where: { hackClubId: profile.id },
    update: data,
    create: { hackClubId: profile.id, ...data },
  });
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const state = request.nextUrl.searchParams.get('state') || '';
  const code = request.nextUrl.searchParams.get('code') || '';
  const storedState = request.cookies.get(config.oauthStateCookieName)?.value || '';

  if (!code) {
    return NextResponse.json({ error: 'Missing OAuth code' }, { status: 400 });
  }

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: 'OAuth state mismatch' }, { status: 400 });
  }

  try {
    const tokenResponse = await exchangeCodeForToken({ code, origin });
    const profilePayload = await fetchHackClubProfile(tokenResponse.access_token || tokenResponse.token || '');
    const profile = normalizeHackClubProfile(profilePayload);

    if (!profile.id) {
      throw new Error('Hack Club profile did not include an identity id');
    }

    await upsertUser(profile);

    const response = NextResponse.redirect(new URL('/dashboard', origin));

    response.cookies.set(config.sessionCookieName, createSessionValue(profile), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
      secure: origin.startsWith('https://'),
    });

    response.cookies.set(config.oauthStateCookieName, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: origin.startsWith('https://'),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Hack Club authentication failed', message: (error as Error).message },
      { status: 500 },
    );
  }
}
