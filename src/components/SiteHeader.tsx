import Link from 'next/link';
import { isAdminId } from '@/lib/admin';
import { getDbUser, getSessionProfile } from '@/lib/session';

// Shared chrome for the public/app pages (explore, shop, profile).
export default async function SiteHeader() {
  const profile = await getSessionProfile();
  const user = profile ? await getDbUser() : null;
  const admin = isAdminId(profile?.id);

  return (
    <header className="dash-topbar">
      <Link className="nav-brand" href="/">⚙ FixHC</Link>
      <div className="dash-topbar__right">
        <Link className="dash-topbar__link" href="/explore">Explore</Link>
        <Link className="dash-topbar__link" href="/shop">Shop</Link>
        {profile ? (
          <Link className="dash-topbar__link" href="/dashboard">Dashboard</Link>
        ) : null}
        {admin ? (
          <Link className="dash-topbar__link" href="/admin">Admin</Link>
        ) : null}
        {user ? <span className="balance-pill">{user.balance} pts</span> : null}
        {profile ? (
          <a className="btn btn-outline dash-user__signout" href="/api/auth/logout">
            Sign out
          </a>
        ) : (
          <a className="btn btn-primary dash-user__signout" href="/api/auth/start">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
