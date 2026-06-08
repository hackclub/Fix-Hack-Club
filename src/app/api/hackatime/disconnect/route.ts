import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrigin } from '@/lib/origin';
import { getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = getOrigin(request);
  const profile = await getSessionProfile();

  if (profile) {
    await prisma.user
      .update({
        where: { hackClubId: profile.id },
        data: {
          hackatimeUserId: null,
          hackatimeUsername: null,
          hackatimeSeconds: 0,
          hackatimeSyncedAt: null,
          hackatimeConnectedAt: null,
        },
      })
      .catch(() => undefined);
  }

  return NextResponse.redirect(new URL('/settings?hackatime=disconnected', origin));
}
