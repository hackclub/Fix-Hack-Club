import Link from 'next/link';
import { isAdminId } from '@/lib/admin';
import { formatPoints } from '@/lib/hackatime';
import { getDbUser, getSessionProfile } from '@/lib/session';
import HeaderNav from './HeaderNav';

// The single shared header used on every page. Reads the session server-side
// and delegates active-link highlighting to the HeaderNav client component.
export default async function SiteHeader() {
  const profile = await getSessionProfile();
  const user = profile ? await getDbUser() : null;
  const admin = isAdminId(profile?.id);
  // Admins can do both review stages, so they always see the Review link too.
  const reviewer = admin || user?.role === 'REVIEWER';
  const displayName = profile?.display_name || profile?.first_name || profile?.email || 'Member';

  return (
    <header className="dash-topbar">
      <Link className="nav-brand" href="/">
        <span aria-hidden="true">⚙</span> FixHC
      </Link>

      <HeaderNav admin={admin} reviewer={reviewer} />

      <div className="dash-topbar__right">
        {user ? (
          <Link className="balance-pill" href="/account">
            {formatPoints(user.balance)} pts
          </Link>
        ) : null}
        {profile ? (
          <Link className="dash-user" href="/account">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dash-user__avatar" src={profile.avatar} alt="" width={32} height={32} />
            ) : null}
            <span className="dash-user__name">{displayName}</span>
          </Link>
        ) : null}
        {profile ? (
          <a className="btn btn-outline btn-sm dash-user__signout" href="/api/auth/logout">
            Sign out
          </a>
        ) : (
          <a className="btn btn-primary btn-sm dash-user__signout" href="/api/auth/start">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
