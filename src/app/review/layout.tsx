import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { getAccess } from '@/lib/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Review' };

// First-grade review console. Open to reviewers and admins; everyone else is
// bounced home. (Admins can do both the first-grade and final review.)
export default async function ReviewLayout({ children }: { children: ReactNode }) {
  const { profile, canReview } = await getAccess();

  if (!profile) {
    redirect('/api/auth/start');
  }
  if (!canReview) {
    redirect('/');
  }

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <SiteHeader />

      <main className="dash-shell">{children}</main>

      <div className="caution-tape"></div>
    </div>
  );
}
