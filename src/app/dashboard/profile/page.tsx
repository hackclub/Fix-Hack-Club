import Link from 'next/link';
import { getDbUser, getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function DashboardProfile() {
  const profile = await getSessionProfile();
  if (!profile) {
    return null;
  }

  const user = await getDbUser();
  const displayName = profile.display_name || profile.first_name || 'Hack Club member';

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy profile-head">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="profile-avatar" src={profile.avatar} alt="" width={64} height={64} />
          ) : null}
          <div>
            <p className="auth-card__eyebrow">Profile</p>
            <h1 className="dashboard-title">{displayName}</h1>
            {user ? (
              <p className="dashboard-copy">
                <Link href={`/u/${user.id}`}>View your public profile</Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <section className="dashboard-panel dashboard-panel--summary">
        <p className="auth-card__eyebrow">Hack Club identity</p>
        <h3>Details</h3>
        <dl className="dash-profile">
          <div className="dash-profile__row">
            <dt>Email</dt>
            <dd>{profile.email || 'Not provided'}</dd>
          </div>
          <div className="dash-profile__row">
            <dt>Verification</dt>
            <dd>{profile.verification_status ? profile.verification_status.replace(/_/g, ' ') : 'Unknown'}</dd>
          </div>
          <div className="dash-profile__row">
            <dt>Role</dt>
            <dd>{user?.role ?? 'MEMBER'}</dd>
          </div>
          <div className="dash-profile__row">
            <dt>Points</dt>
            <dd>{user?.balance ?? 0}</dd>
          </div>
          <div className="dash-profile__row">
            <dt>Earned all-time</dt>
            <dd>{user?.totalEarned ?? 0}</dd>
          </div>
        </dl>
        <p className="settings-hint">
          Manage your account on the <Link href="/settings">settings page</Link>.
        </p>
      </section>
    </>
  );
}
