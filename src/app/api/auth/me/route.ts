import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { readSessionValue } from '@/lib/hackclub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const user = readSessionValue(cookieStore.get(config.sessionCookieName)?.value);

  return NextResponse.json({ signedIn: Boolean(user), user: user ?? null });
}
