import { cookies } from 'next/headers';
import type { User } from '@prisma/client';
import { config } from './config';
import { prisma } from './db';
import { readSessionValue } from './hackclub';
import type { HackClubProfile } from './types';

// Read and verify the signed session cookie. Returns the Hack Club profile or null.
export async function getSessionProfile(): Promise<HackClubProfile | null> {
  const cookieStore = await cookies();
  return readSessionValue(cookieStore.get(config.sessionCookieName)?.value);
}

// Load the persisted User row for the current session (role, balance, etc.).
export async function getDbUser(): Promise<User | null> {
  const profile = await getSessionProfile();
  if (!profile?.id) {
    return null;
  }
  return prisma.user.findUnique({ where: { hackClubId: profile.id } });
}
