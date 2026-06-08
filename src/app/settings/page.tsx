import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import CopyButton from '@/components/CopyButton';
import { prisma } from '@/lib/db';
import { fetchHackatimeProjects, secondsToHours } from '@/lib/hackatime';
import { getDbUser, getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Settings' };

const HACKATIME_MESSAGES: Record<string, string> = {
  connected: 'Hackatime connected.',
  disconnected: 'Hackatime disconnected.',
  denied: 'Hackatime authorization was cancelled.',
  error: 'Could not connect Hackatime. Please try again.',
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ hackatime?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const sp = await searchParams;
  const dbUser = await getDbUser();
  const connected = Boolean(dbUser?.hackatimeUserId);

  // Live-refresh tracked time + top projects when connected.
  let topProjects: { name: string; seconds: number }[] = [];
  let totalSeconds = dbUser?.hackatimeSeconds ?? 0;
  if (connected && dbUser) {
    const projects = await fetchHackatimeProjects(dbUser.hackatimeUserId as string);
    if (projects.length) {
      topProjects = projects.slice(0, 5);
      totalSeconds = projects.reduce((sum, p) => sum + p.seconds, 0);
      await prisma.user
        .update({ where: { id: dbUser.id }, data: { hackatimeSeconds: totalSeconds, hackatimeSyncedAt: new Date() } })
        .catch(() => undefined);
    }
  }

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Account</p>
            <h1 className="dashboard-title">Settings</h1>
            <p className="dashboard-copy">Your Hack Club identity, Hackatime link, and account details.</p>
          </div>
        </div>

        {sp.hackatime && HACKATIME_MESSAGES[sp.hackatime] ? (
          <p className={`flash ${sp.hackatime === 'connected' || sp.hackatime === 'disconnected' ? 'flash--ok' : 'flash--error'}`}>
            {HACKATIME_MESSAGES[sp.hackatime]}
          </p>
        ) : null}

        <section className="dashboard-panel dashboard-panel--summary">
          <p className="auth-card__eyebrow">Time tracking</p>
          <h3>Hackatime</h3>
          {connected ? (
            <>
              <dl className="dash-profile">
                <div className="dash-profile__row">
                  <dt>Status</dt>
                  <dd><span className="status-badge status-approved">Connected</span></dd>
                </div>
                {dbUser?.hackatimeUsername ? (
                  <div className="dash-profile__row">
                    <dt>Account</dt>
                    <dd>{dbUser.hackatimeUsername}</dd>
                  </div>
                ) : null}
                <div className="dash-profile__row">
                  <dt>Total tracked</dt>
                  <dd>{secondsToHours(totalSeconds)}h</dd>
                </div>
              </dl>
              {topProjects.length ? (
                <div className="dashboard-list">
                  {topProjects.map((p) => (
                    <div className="dashboard-list__item-head" key={p.name}>
                      <span>{p.name}</span>
                      <span className="balance-pill">{secondsToHours(p.seconds)}h</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="settings-hint">You earn 1 point per hour of a linked project when a submission is approved.</p>
              <a className="btn btn-outline" href="/api/hackatime/disconnect">Disconnect Hackatime</a>
            </>
          ) : (
            <>
              <p className="dashboard-copy">Connect Hackatime to link your coding time to submissions and earn points.</p>
              <a className="btn btn-primary" href="/api/hackatime/start">Connect Hackatime</a>
            </>
          )}
        </section>

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
