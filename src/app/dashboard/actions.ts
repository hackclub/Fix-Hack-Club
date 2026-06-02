'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSessionProfile } from '@/lib/session';

export async function submitFixAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/dashboard');
  }

  const title = String(formData.get('title') || '').trim();
  const url = String(formData.get('url') || '').trim();
  const repo = String(formData.get('repo') || '').trim();
  const notes = String(formData.get('notes') || '').trim();
  const category = String(formData.get('category') || 'Other').trim() || 'Other';
  const hackatimeProject = String(formData.get('hackatimeProject') || '').trim() || null;

  if (!title || !url || !repo) {
    redirect(`/dashboard/submit?error=${encodeURIComponent('Title, link, and repo are required.')}`);
  }

  await prisma.submission.create({
    data: {
      hackClubId: profile.id,
      email: profile.email || '',
      displayName: profile.display_name || '',
      title,
      url,
      repo,
      category,
      notes,
      hackatimeProject,
      status: 'Submitted',
    },
  });

  revalidatePath('/dashboard/submissions');
  revalidatePath('/dashboard');
  redirect('/dashboard/submissions');
}
