import type { HackClubProfile } from './types';

// Admins are identified by an env allowlist of Hack Club identity ids,
// e.g. ADMIN_HACK_CLUB_IDS="ident!abc123, ident!def456".
export function getAdminIds(): string[] {
  return (process.env.ADMIN_HACK_CLUB_IDS || '')
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminId(id: string | null | undefined): boolean {
  if (!id) {
    return false;
  }
  return getAdminIds().includes(String(id));
}

export function isAdminProfile(profile: HackClubProfile | null | undefined): boolean {
  return isAdminId(profile?.id);
}
