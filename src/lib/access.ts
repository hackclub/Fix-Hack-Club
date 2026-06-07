import { Role } from '@prisma/client';
import { isAdminId } from './admin';
import { prisma } from './db';
import { getSessionProfile } from './session';
import type { HackClubProfile } from './types';

export interface Access {
  profile: HackClubProfile | null;
  // Admin via the ADMIN_HACK_CLUB_IDS env allowlist.
  isAdmin: boolean;
  // Holds the REVIEWER role (granted by an admin from the Users page).
  isReviewer: boolean;
  // Allowed to perform the first-grade review: reviewers OR admins.
  canReview: boolean;
}

// Resolve the current session's review permissions. Admins are identified by the
// env allowlist; the REVIEWER role lives on the User row. Admins can do both the
// first-grade and the final review, so they always satisfy `canReview`.
export async function getAccess(): Promise<Access> {
  const profile = await getSessionProfile();
  if (!profile?.id) {
    return { profile: null, isAdmin: false, isReviewer: false, canReview: false };
  }

  const isAdmin = isAdminId(profile.id);
  const user = await prisma.user.findUnique({
    where: { hackClubId: profile.id },
    select: { role: true },
  });
  const isReviewer = user?.role === Role.REVIEWER;

  return { profile, isAdmin, isReviewer, canReview: isAdmin || isReviewer };
}
