'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { fetchHackatimeProjectSeconds } from '@/lib/hackatime';
import { getSessionProfile } from '@/lib/session';

// Create a new fix as a DRAFT and send the author to its project page.
// Drafts are private working space — they only enter the admin review queue
// once the author presses "Submit for review" (submitForReviewAction below).
export async function submitFixAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const get = (name: string) => String(formData.get(name) || '').trim();

  const title = get('title');
  const url = get('url');
  const repo = get('repo');
  const category = get('category') || 'Other';
  const hackatimeProject = get('hackatimeProject') || null;

  // Personal info (from the wizard's Info step).
  const firstName = get('firstName');
  const lastName = get('lastName');
  const email = get('email') || profile.email || '';
  const githubUsername = get('githubUsername');
  const dateOfBirth = get('dateOfBirth') || null;
  const slackId = get('slackId') || profile.slack_id || null;
  const submissionType = get('submissionType') || 'Individual Submission';

  if (!title || !url || !repo) {
    redirect(`/projects/submit?error=${encodeURIComponent('Title, link, and repo are required.')}`);
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || profile.display_name || '';

  const created = await prisma.submission.create({
    data: {
      hackClubId: profile.id,
      email,
      displayName,
      firstName: firstName || null,
      lastName: lastName || null,
      githubUsername: githubUsername || null,
      dateOfBirth,
      slackId,
      submissionType,
      title,
      url,
      repo,
      category,
      notes: '',
      hackatimeProject,
      status: 'Draft',
    },
  });

  revalidatePath('/account');
  revalidatePath('/projects');
  redirect(`/projects/${created.id}`);
}

// Move a draft (or a previously rejected fix) into the admin review queue.
// Only the author may do this, and only from Draft/Rejected — never from an
// already-submitted or approved state.
export async function submitForReviewAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const submissionId = String(formData.get('submissionId') || '');
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });

  if (!submission || submission.hackClubId !== profile.id) {
    redirect('/account');
  }

  if (submission.status === 'Draft' || submission.status === 'Rejected') {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'Submitted' },
    });
  }

  revalidatePath(`/projects/${submissionId}`);
  revalidatePath('/account');
  revalidatePath('/admin/submissions');
  redirect(`/projects/${submissionId}`);
}

export async function postDevlogAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const submissionId = String(formData.get('submissionId') || '');
  const text = String(formData.get('text') || '').trim();

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.hackClubId !== profile.id) {
    redirect('/account');
  }

  if (!text) {
    redirect(`/projects/${submissionId}?error=${encodeURIComponent('Write something in your devlog.')}`);
  }

  // Read the linked Hackatime project's current cumulative time, then record the
  // delta logged in THIS devlog (time since the last one). The submission's
  // loggedSeconds tracks the cumulative total; pending points derive from it.
  let cumulativeSeconds = 0;
  if (submission.hackatimeProject) {
    const author = await prisma.user.findUnique({ where: { hackClubId: submission.hackClubId } });
    if (author?.hackatimeUserId) {
      cumulativeSeconds = await fetchHackatimeProjectSeconds(author.hackatimeUserId, submission.hackatimeProject);
    }
  }

  const delta = Math.max(0, cumulativeSeconds - submission.loggedSeconds);

  await prisma.devlog.create({
    data: { submissionId, hackClubId: profile.id, text, seconds: delta },
  });

  if (cumulativeSeconds > submission.loggedSeconds) {
    await prisma.submission.update({ where: { id: submissionId }, data: { loggedSeconds: cumulativeSeconds } });
  }

  revalidatePath(`/projects/${submissionId}`);
  revalidatePath('/account');
  revalidatePath('/admin/submissions');
  redirect(`/projects/${submissionId}`);
}
