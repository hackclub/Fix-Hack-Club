import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, type Submission } from '@prisma/client';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { readSessionValue } from '@/lib/hackclub';
import type { SubmissionDTO } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serialize(submission: Submission): SubmissionDTO {
  return {
    id: submission.id,
    title: submission.title,
    url: submission.url || '',
    repo: submission.repo || '',
    category: submission.category || 'Other',
    notes: submission.notes || '',
    status: submission.status || 'Submitted',
    created_at: submission.createdAt ? submission.createdAt.toISOString() : null,
  };
}

async function currentUser() {
  const cookieStore = await cookies();
  return readSessionValue(cookieStore.get(config.sessionCookieName)?.value);
}

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Sign in to submit.' }, { status: 401 });
  }

  const hackClubId = user.id ? String(user.id) : '';
  const email = user.email ? String(user.email) : '';

  try {
    const filters: Prisma.SubmissionWhereInput[] = [];
    if (hackClubId) filters.push({ hackClubId });
    if (email) filters.push({ email });

    const submissions = await prisma.submission.findMany({
      where: filters.length ? { OR: filters } : { hackClubId: '__none__' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ submissions: submissions.map(serialize) });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to load submissions', message: (error as Error).message, submissions: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Sign in to submit.' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body?.title || !body?.url || !body?.repo) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Title, URL, and repo are required.' },
        { status: 400 },
      );
    }

    await prisma.submission.create({
      data: {
        hackClubId: user.id ? String(user.id) : '',
        email: user.email ? String(user.email) : '',
        displayName: user.display_name || '',
        title: String(body.title),
        url: String(body.url),
        repo: String(body.repo),
        category: body.category ? String(body.category) : 'Other',
        notes: body.notes ? String(body.notes) : '',
        status: 'Submitted',
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to submit', message: (error as Error).message }, { status: 500 });
  }
}
