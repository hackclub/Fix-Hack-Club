import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminId } from '@/lib/admin';
import { getSessionProfile } from '@/lib/session';

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
            <nav className="dash-nav" aria-label="Admin sections">
              <Link className="dash-nav__link" href="/admin">Overview</Link>
              <Link className="dash-nav__link" href="/admin/submissions">Submissions</Link>
              <Link className="dash-nav__link" href="/admin/listings">Listings</Link>
              <Link className="dash-nav__link" href="/admin/shop">Shop items</Link>
              <Link className="dash-nav__link" href="/admin/orders">Orders</Link>
              <Link className="dash-nav__link" href="/admin/users">Users</Link>
            </nav>
          </aside>

          <div className="dash-main">{children}</div>
        </div>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
