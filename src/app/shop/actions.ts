'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { redeemItem } from '@/lib/economy';
import { getSessionProfile } from '@/lib/session';

export async function redeemAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/dashboard');
  }

  const user = await prisma.user.findUnique({ where: { hackClubId: profile.id } });
  if (!user) {
    redirect('/dashboard');
  }

  const itemId = String(formData.get('itemId') || '');
  let errorMessage = '';

  try {
    await redeemItem(user.id, itemId);
  } catch (error) {
    errorMessage = (error as Error).message || 'Could not redeem this item.';
  }

  if (errorMessage) {
    redirect(`/shop?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath('/shop');
  redirect('/shop?redeemed=1');
}
