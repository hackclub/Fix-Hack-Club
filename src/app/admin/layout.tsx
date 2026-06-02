import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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
    redirect('/dashboard');
  }
  if (!isAdminId(profile.id)) {
    redirect('/');
  }

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <header className="dash-topbar">
        <Link className="nav-brand" href="/">⚙ FixHC</Link>
        <div className="dash-topbar__right">
          <span className="balance-pill">Admin</span>
          <Link className="dash-topbar__link" href="/dashboard">Dashboard</Link>
          <a className="btn btn-outline dash-user__signout" href="/api/auth/logout">Sign out</a>
        </div>
      </header>

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
