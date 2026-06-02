import type { ReactNode } from 'react';
import Link from 'next/link';
import SideNav from '@/components/SideNav';
import { isAdminId } from '@/lib/admin';
import { getDbUser, getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Dashboard' };

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/submit', label: 'Submit a fix' },
  { href: '/dashboard/submissions', label: 'My submissions' },
  { href: '/dashboard/profile', label: 'Profile' },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getSessionProfile();

  if (!profile) {
    return (
      <div className="dash-body">
        <div className="caution-tape"></div>
        <header className="dash-topbar">
          <Link className="nav-brand" href="/">⚙ FixHC</Link>
          <div className="dash-topbar__right">
            <Link className="dash-topbar__link" href="/explore">Explore</Link>
            <Link className="dash-topbar__link" href="/shop">Shop</Link>
            <a className="btn btn-primary btn-sm" href="/api/auth/start">Sign in</a>
          </div>
        </header>
        <main className="dash-shell">
          <section className="dash-gate">
            <div className="dash-gate__card">
              <p className="auth-card__eyebrow">FixHC Workspace</p>
              <h1 className="dash-gate__title">Sign in to your dashboard</h1>
              <p className="dash-gate__copy">
                Link your Hack Club account to submit fixes, earn points, and track your contributions.
              </p>
              <a className="btn btn-primary dash-gate__button" href="/api/auth/start">Sign in with Hack Club</a>
              <a className="dash-gate__back" href="/">Return to the landing page</a>
            </div>
          </section>
        </main>
        <div className="caution-tape"></div>
      </div>
    );
  }

  const user = await getDbUser();
  const admin = isAdminId(profile.id);
  const displayName = profile.display_name || profile.first_name || profile.email || 'Member';

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <header className="dash-topbar">
        <Link className="nav-brand" href="/">⚙ FixHC</Link>
        <div className="dash-topbar__right">
          <Link className="dash-topbar__link" href="/explore">Explore</Link>
          <Link className="dash-topbar__link" href="/shop">Shop</Link>
          <Link className="dash-topbar__link" href="/settings">Settings</Link>
          {admin ? <Link className="dash-topbar__link" href="/admin">Admin</Link> : null}
          <span className="balance-pill">{user?.balance ?? 0} pts</span>
          <div className="dash-user">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dash-user__avatar" src={profile.avatar} alt="" width={32} height={32} />
            ) : null}
            <span className="dash-user__name">{displayName}</span>
            <a className="btn btn-outline dash-user__signout" href="/api/auth/logout">Sign out</a>
          </div>
        </div>
      </header>

      <main className="dash-shell">
        <div className="dash-layout">
          <aside className="dash-sidebar">
            <SideNav items={NAV_ITEMS} ariaLabel="Dashboard sections" roots={['/dashboard']} />
          </aside>
          <div className="dash-main">{children}</div>
        </div>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
