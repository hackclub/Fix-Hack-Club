import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import CopyButton from '@/components/CopyButton';
import { getDbUser, getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Settings' };

export default async function SettingsPage() {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/dashboard');
  }

  const dbUser = await getDbUser();

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Account</p>
            <h1 className="dashboard-title">Settings</h1>
            <p className="dashboard-copy">Your Hack Club identity and account details.</p>
          </div>
        </div>

        <section className="dashboard-panel dashboard-panel--summary">
          <p className="auth-card__eyebrow">Hack Club identity</p>
          <h3>Identity</h3>
          <dl className="dash-profile">
            <div className="dash-profile__row">
              <dt>Auth ID</dt>
              <dd className="auth-id-cell">
                <code className="auth-id">{profile.id}</code>
                <CopyButton value={profile.id} />
              </dd>
            </div>
            <div className="dash-profile__row">
              <dt>Name</dt>
              <dd>{profile.display_name || 'Not provided'}</dd>
            </div>
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
              <dd>{dbUser?.role ?? 'MEMBER'}</dd>
            </div>
            <div className="dash-profile__row">
              <dt>Points</dt>
              <dd>{dbUser?.balance ?? 0}</dd>
            </div>
          </dl>
          <p className="settings-hint">
            Your Auth ID is the value to put in <code>ADMIN_HACK_CLUB_IDS</code> to grant admin access.
          </p>
        </section>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
