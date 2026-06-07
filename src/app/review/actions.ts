'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';
import { isAdminId } from '@/lib/admin';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { readSessionValue } from '@/lib/hackclub';
import { REVIEW_STAGE } from '@/lib/reviews';
import type { HackClubProfile } from '@/lib/types';

// First-grade review is open to reviewers AND admins (admins can do both stages).
async function requireReviewer(): Promise<HackClubProfile> {
  const cookieStore = await cookies();
  const profile = readSessionValue(cookieStore.get(config.sessionCookieName)?.value);
  if (!profile) {
    throw new Error('Forbidden');
  }
  if (isAdminId(profile.id)) {
    return profile;
  }
  const user = await prisma.user.findUnique({
    where: { hackClubId: profile.id },
    select: { role: true },
  });
  if (user?.role !== Role.REVIEWER) {
    throw new Error('Forbidden');
  }
  return profile;
}

function str(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

// Record a first-grade recommendation (approve or deny + reason) and advance the
// submission to the final admin queue. This never awards points — only the final
// admin approval does that. We only act on items still awaiting first review.
async function recordFirstReview(formData: FormData, decision: 'Approved' | 'Rejected') {
  const reviewer = await requireReviewer();
  const id = str(formData, 'id');
  const reason = str(formData, 'reason');

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission || submission.status !== 'Submitted' || submission.reviewStage !== REVIEW_STAGE.FIRST) {
    revalidatePath('/review');
    return;
  }

  await prisma.submission.update({
    where: { id },
    data: {
      reviewStage: REVIEW_STAGE.FINAL,
      firstReviewStatus: decision,
      firstReviewNote: reason || null,
      firstReviewedAt: new Date(),
      firstReviewedById: reviewer.id,
    },
  });

  revalidatePath('/review');
  revalidatePath('/admin');
  revalidatePath('/admin/submissions');
}

export async function firstApproveAction(formData: FormData) {
  await recordFirstReview(formData, 'Approved');
}

export async function firstRejectAction(formData: FormData) {
  await recordFirstReview(formData, 'Rejected');
}
