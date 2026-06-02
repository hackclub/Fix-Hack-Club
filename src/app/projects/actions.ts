'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { fetchHackatimeProjectSeconds } from '@/lib/hackatime';
import { getSessionProfile } from '@/lib/session';

export async function postDevlogAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/dashboard');
  }

  const submissionId = String(formData.get('submissionId') || '');
  const text = String(formData.get('text') || '').trim();

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.hackClubId !== profile.id) {
    redirect('/dashboard/submissions');
  }

  if (!text) {
    redirect(`/projects/${submissionId}?error=${encodeURIComponent('Write something in your devlog.')}`);
  }

  // Snapshot the linked Hackatime project's current tracked time. Only this
  // logged time counts toward points on approval.
  let seconds = 0;
  if (submission.hackatimeProject) {
    const author = await prisma.user.findUnique({ where: { hackClubId: submission.hackClubId } });
    if (author?.hackatimeUserId) {
      seconds = await fetchHackatimeProjectSeconds(author.hackatimeUserId, submission.hackatimeProject);
    }
  }

  await prisma.devlog.create({
    data: { submissionId, hackClubId: profile.id, text, seconds },
  });

  if (seconds > submission.loggedSeconds) {
    await prisma.submission.update({ where: { id: submissionId }, data: { loggedSeconds: seconds } });
  }

  revalidatePath(`/projects/${submissionId}`);
  revalidatePath('/dashboard/submissions');
  revalidatePath('/admin/submissions');
  redirect(`/projects/${submissionId}`);
}
