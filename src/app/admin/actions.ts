'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isAdminId } from '@/lib/admin';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import {
  adjustBalance,
  approveSubmission,
  fulfillOrder,
  refundOrder,
  rejectSubmission,
} from '@/lib/economy';
import { readSessionValue } from '@/lib/hackclub';
import { fetchHackatimeProjectSeconds, secondsToPoints } from '@/lib/hackatime';
import type { HackClubProfile } from '@/lib/types';

async function requireAdmin(): Promise<HackClubProfile> {
  const cookieStore = await cookies();
  const profile = readSessionValue(cookieStore.get(config.sessionCookieName)?.value);
  if (!profile || !isAdminId(profile.id)) {
    throw new Error('Forbidden');
  }
  return profile;
}

function str(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function int(formData: FormData, name: string, fallback = 0): number {
  const value = parseInt(String(formData.get(name) ?? ''), 10);
  return Number.isFinite(value) ? value : fallback;
}

// ---- Submissions ----
// Points = 1 per hour of the linked Hackatime project (fetched live by the
// author's Hackatime user id). Submissions without a linked project fall back
// to the manually entered points.
export async function approveSubmissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, 'id');

  const submission = await prisma.submission.findUnique({ where: { id } });
  let points = int(formData, 'points', 0);

  if (submission?.hackatimeProject) {
    const author = await prisma.user.findUnique({ where: { hackClubId: submission.hackClubId } });
    if (author?.hackatimeUserId) {
      const seconds = await fetchHackatimeProjectSeconds(author.hackatimeUserId, submission.hackatimeProject);
      points = secondsToPoints(seconds);
    }
  }

  await approveSubmission(id, points, admin.id);
  revalidatePath('/admin/submissions');
  revalidatePath('/explore');
}

export async function rejectSubmissionAction(formData: FormData) {
  const admin = await requireAdmin();
  await rejectSubmission(str(formData, 'id'), admin.id);
  revalidatePath('/admin/submissions');
  revalidatePath('/explore');
}

// ---- Listings ----
function parseRequirements(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createListingAction(formData: FormData) {
  await requireAdmin();
  await prisma.listing.create({
    data: {
      externalId: str(formData, 'externalId') || null,
      title: str(formData, 'title') || 'Untitled',
      description: str(formData, 'description'),
      url: str(formData, 'url'),
      githubUrl: str(formData, 'githubUrl'),
      requirements: parseRequirements(str(formData, 'requirements')),
      status: str(formData, 'status') || 'active',
      priority: int(formData, 'priority', 0),
    },
  });
  revalidatePath('/admin/listings');
  revalidatePath('/');
}

export async function updateListingAction(formData: FormData) {
  await requireAdmin();
  const status = str(formData, 'status') || 'active';
  await prisma.listing.update({
    where: { id: str(formData, 'id') },
    data: {
      title: str(formData, 'title') || 'Untitled',
      description: str(formData, 'description'),
      url: str(formData, 'url'),
      githubUrl: str(formData, 'githubUrl'),
      requirements: parseRequirements(str(formData, 'requirements')),
      status,
      priority: int(formData, 'priority', 0),
      completedAt: status === 'finished' ? new Date() : null,
    },
  });
  revalidatePath('/admin/listings');
  revalidatePath('/');
}

export async function deleteListingAction(formData: FormData) {
  await requireAdmin();
  await prisma.listing.delete({ where: { id: str(formData, 'id') } });
  revalidatePath('/admin/listings');
  revalidatePath('/');
}

// ---- Shop items ----
export async function createShopItemAction(formData: FormData) {
  await requireAdmin();
  const stockRaw = str(formData, 'stock');
  await prisma.shopItem.create({
    data: {
      name: str(formData, 'name') || 'Item',
      description: str(formData, 'description'),
      cost: int(formData, 'cost', 0),
      imageUrl: str(formData, 'imageUrl') || null,
      stock: stockRaw === '' ? null : int(formData, 'stock', 0),
      active: formData.get('active') != null,
    },
  });
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
}

export async function updateShopItemAction(formData: FormData) {
  await requireAdmin();
  const stockRaw = str(formData, 'stock');
  await prisma.shopItem.update({
    where: { id: str(formData, 'id') },
    data: {
      name: str(formData, 'name') || 'Item',
      description: str(formData, 'description'),
      cost: int(formData, 'cost', 0),
      imageUrl: str(formData, 'imageUrl') || null,
      stock: stockRaw === '' ? null : int(formData, 'stock', 0),
      active: formData.get('active') != null,
    },
  });
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
}

export async function deleteShopItemAction(formData: FormData) {
  await requireAdmin();
  await prisma.shopItem.delete({ where: { id: str(formData, 'id') } });
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
}

// ---- Orders ----
export async function fulfillOrderAction(formData: FormData) {
  await requireAdmin();
  await fulfillOrder(str(formData, 'id'), str(formData, 'note'));
  revalidatePath('/admin/orders');
  revalidatePath('/shop');
}

export async function refundOrderAction(formData: FormData) {
  await requireAdmin();
  await refundOrder(str(formData, 'id'));
  revalidatePath('/admin/orders');
  revalidatePath('/shop');
}

// ---- Users ----
export async function adjustBalanceAction(formData: FormData) {
  await requireAdmin();
  await adjustBalance(str(formData, 'userId'), int(formData, 'delta', 0), str(formData, 'reason'));
  revalidatePath('/admin/users');
}
