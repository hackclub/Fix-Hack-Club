import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminId } from '@/lib/admin';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { readSessionValue } from '@/lib/hackclub';
import { buildYswsCsv } from '@/lib/ysws';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin-only download of the Unified YSWS review CSV. Route handlers are not
// wrapped by the admin layout, so we guard here directly. Excludes drafts (not
// yet submitted for review). The CSV contains PII, hence admin-only.
export async function GET() {
  const cookieStore = await cookies();
  const profile = readSessionValue(cookieStore.get(config.sessionCookieName)?.value);
  if (!profile || !isAdminId(profile.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const submissions = await prisma.submission.findMany({
    where: { status: { not: 'Draft' } },
    orderBy: { createdAt: 'desc' },
  });

  const csv = buildYswsCsv(submissions);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Projects-Review-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
