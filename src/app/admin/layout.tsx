import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SideNav from '@/components/SideNav';
import { getAccess } from '@/lib/access';

// Admins see the full console. Reviewers are let into the same shell but only
// for the first-grade review — every other section is hidden from their nav and
// blocked at the page level (see requireAdminOnly in @/lib/access).
const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/review', label: 'First review' },
  { href: '/admin/submissions', label: 'Final review' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/shop', label: 'Shop items' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
];

const REVIEWER_NAV = [{ href: '/admin/review', label: 'First review' }];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Admin' };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, canReview } = await getAccess();

  if (!profile) {
    redirect('/api/auth/start');
  }
  if (!canReview) {
    redirect('/');
  }

  const navItems = isAdmin ? ADMIN_NAV : REVIEWER_NAV;

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-layout">
          <aside className="dash-sidebar">
            <SideNav items={navItems} ariaLabel="Admin sections" roots={['/admin']} />
          </aside>

          <div className="dash-main">{children}</div>
        </div>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
