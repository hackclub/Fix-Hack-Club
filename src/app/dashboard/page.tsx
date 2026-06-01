import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { readSessionValue } from '@/lib/hackclub';
import DashboardWorkspace from '@/components/DashboardWorkspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FixHC - Dashboard',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const user = readSessionValue(cookieStore.get(config.sessionCookieName)?.value);

  if (!user) {
    return (
      <div className="dash-body">
        <div className="caution-tape"></div>

        <header className="dash-topbar">
          <a className="nav-brand" href="/">
            ⚙ FixHC
          </a>
          <div className="dash-topbar__right">
            <a className="dash-topbar__link" href="/">
              Back to site
            </a>
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

  const displayName = user.display_name || user.first_name || user.email || 'Member';

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>

      <header className="dash-topbar">
        <a className="nav-brand" href="/">
          ⚙ FixHC
        </a>
        <div className="dash-topbar__right">
          <a className="dash-topbar__link" href="/">
            Back to site
          </a>
          <div className="dash-user">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dash-user__avatar" src={user.avatar} alt="" width={32} height={32} />
            ) : null}
            <span className="dash-user__name">{displayName}</span>
            <a className="btn btn-outline dash-user__signout" href="/api/auth/logout">
              Sign out
            </a>
          </div>
        </div>
      </header>

      <main className="dash-shell">
        <DashboardWorkspace user={user} />
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
