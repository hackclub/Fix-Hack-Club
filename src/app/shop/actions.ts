'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { redeemItem } from '@/lib/economy';
import { getSessionProfile } from '@/lib/session';

export async function redeemAction(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const user = await prisma.user.findUnique({ where: { hackClubId: profile.id } });
  if (!user) {
    redirect('/api/auth/start');
  }

  const get = (name: string) => String(formData.get(name) || '').trim();
  const itemId = get('itemId');

  const details = {
    grantType: get('grantType'),
    fulfilment: get('fulfilment'),
    addressLine1: get('addressLine1'),
    addressLine2: get('addressLine2'),
    city: get('city'),
    state: get('state'),
    zip: get('zip'),
    country: get('country'),
  };

  // Grant type, fulfilment, and a shipping address (except line 2) are required.
  const required: Record<string, string> = {
    grantType: details.grantType,
    fulfilment: details.fulfilment,
    addressLine1: details.addressLine1,
    city: details.city,
    state: details.state,
    zip: details.zip,
    country: details.country,
  };
  if (Object.values(required).some((v) => !v)) {
    redirect(`/shop/redeem/${itemId}?error=${encodeURIComponent('Please complete all required grant and address fields.')}`);
  }

  let errorMessage = '';
  try {
    await redeemItem(user.id, itemId, details);
  } catch (error) {
    errorMessage = (error as Error).message || 'Could not redeem this item.';
  }

  if (errorMessage) {
    redirect(`/shop?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath('/shop');
  redirect('/shop?redeemed=1');
}
