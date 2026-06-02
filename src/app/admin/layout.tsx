import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SideNav from '@/components/SideNav';
import { isAdminId } from '@/lib/admin';
import { getSessionProfile } from '@/lib/session';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/shop', label: 'Shop items' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Admin' };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect('/api/auth/start');
  }
  if (!isAdminId(profile.id)) {
    redirect('/');
  }

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-layout">
          <aside className="dash-sidebar">
            <SideNav items={ADMIN_NAV} ariaLabel="Admin sections" roots={['/admin']} />
          </aside>

          <div className="dash-main">{children}</div>
        </div>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
