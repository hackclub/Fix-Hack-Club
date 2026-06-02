import Link from 'next/link';
import { isAdminId } from '@/lib/admin';
import { getDbUser, getSessionProfile } from '@/lib/session';
import DashboardWorkspace from '@/components/DashboardWorkspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FixHC - Dashboard',
};

export default async function DashboardPage() {
  const profile = await getSessionProfile();

  if (!profile) {
    return (
      <div className="dash-body">
        <div className="caution-tape"></div>

        <header className="dash-topbar">
          <a className="nav-brand" href="/">⚙ FixHC</a>
          <div className="dash-topbar__right">
            <a className="dash-topbar__link" href="/explore">Explore</a>
            <a className="dash-topbar__link" href="/shop">Shop</a>
            <a className="dash-topbar__link" href="/">Back to site</a>
          </div>
        </header>

        <main className="dash-shell">
          <section className="dash-gate">
            <div className="dash-gate__card">
              <p className="auth-card__eyebrow">FixHC Workspace</p>
              <h1 className="dash-gate__title">Sign in to your dashboard</h1>
              <p className="dash-gate__copy">
                Link your Hack Club account to submit fixes, track your contributions, and keep everything in one place.
              </p>
              <a className="btn btn-primary dash-gate__button" href="/api/auth/start">
                Sign in with Hack Club
              </a>
              <a className="dash-gate__back" href="/">
                Return to the landing page
              </a>
            </div>
          </section>
        </main>

        <div className="caution-tape"></div>
      </div>
    );
  }

  const dbUser = await getDbUser();
  const admin = isAdminId(profile.id);
  const displayName = profile.display_name || profile.first_name || profile.email || 'Member';

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <header className="dash-topbar">
        <a className="nav-brand" href="/">⚙ FixHC</a>
        <div className="dash-topbar__right">
          <Link className="dash-topbar__link" href="/explore">Explore</Link>
          <Link className="dash-topbar__link" href="/shop">Shop</Link>
          <Link className="dash-topbar__link" href="/settings">Settings</Link>
          {admin ? <Link className="dash-topbar__link" href="/admin">Admin</Link> : null}
          <div className="dash-user">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dash-user__avatar" src={profile.avatar} alt="" width={32} height={32} />
            ) : null}
            <span className="dash-user__name">{displayName}</span>
            <a className="btn btn-outline dash-user__signout" href="/api/auth/logout">
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="dash-shell">
        <DashboardWorkspace user={profile} balance={dbUser?.balance ?? 0} />
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
