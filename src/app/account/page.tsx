import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { secondsToHours, secondsToPoints } from '@/lib/hackatime';
import { getDbUser, getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Account' };

export default async function AccountPage() {
  const profile = await getSessionProfile();

  if (!profile) {
    return (
      <div className="dash-body">
        <div className="caution-tape"></div>
        <SiteHeader />
        <main className="dash-shell">
          <section className="dash-gate">
            <div className="dash-gate__card">
              <p className="auth-card__eyebrow">FixHC Account</p>
              <h1 className="dash-gate__title">Sign in to continue</h1>
              <p className="dash-gate__copy">Link your Hack Club account to submit fixes, earn points, and track your contributions.</p>
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
  const submissions = await prisma.submission.findMany({
    where: { hackClubId: profile.id },
    orderBy: { createdAt: 'desc' },
  });
  // The points ledger: every + (approvals, refunds, admin grants) and
  // - (shop spends, clawbacks) movement on this account.
  const ledger = user
    ? await prisma.ledgerEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
    : [];

  const approved = submissions.filter((s) => s.status === 'Approved').length;
  const pending = submissions.filter((s) => s.status === 'Submitted').length;
  const drafts = submissions.filter((s) => s.status === 'Draft').length;
  const pendingPoints = submissions
    .filter((s) => s.status === 'Submitted')
    .reduce((sum, s) => sum + secondsToPoints(s.loggedSeconds), 0);

  const displayName = profile.display_name || profile.first_name || 'Hack Club member';

  const stats: { label: string; value: number | string }[] = [
    { label: 'Points', value: user?.balance ?? 0 },
    { label: 'Pending points', value: pendingPoints },
    { label: 'Earned all-time', value: user?.totalEarned ?? 0 },
    { label: 'Approved fixes', value: approved },
    { label: 'Awaiting review', value: pending },
    { label: 'Drafts', value: drafts },
  ];
  if (user?.hackatimeUserId) {
    stats.push({ label: 'Coding time', value: `${secondsToHours(user.hackatimeSeconds)}h` });
  }

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy profile-head">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar" src={profile.avatar} alt="" width={64} height={64} />
            ) : null}
            <div>
              <p className="auth-card__eyebrow">Account</p>
              <h1 className="dashboard-title">{displayName}</h1>
              {user ? (
                <p className="dashboard-copy">
                  <Link href={`/u/${user.id}`}>View public profile</Link> · <Link href="/settings">Settings</Link>
                </p>
              ) : null}
            </div>
          </div>
          <div className="btn-row">
            <Link href="/projects/submit" className="btn btn-primary">⚒ Submit a fix</Link>
          </div>
        </div>

        <div className="stat-grid">
          {stats.map((s) => (
            <div className="dashboard-stat" key={s.label}>
              <span className="dashboard-stat__label">{s.label}</span>
              <span className="dashboard-stat__value">{s.value}</span>
            </div>
          ))}
        </div>

        <section className="dashboard-panel dashboard-panel--list" style={{ marginTop: 22 }}>
          <div className="dashboard-form__header">
            <p className="auth-card__eyebrow">Points</p>
            <h3>Points activity</h3>
          </div>
          {ledger.length === 0 ? (
            <p className="dashboard-list__empty">No points activity yet. Approved fixes and shop redemptions will show up here.</p>
          ) : (
            <div className="ledger">
              {ledger.map((entry) => (
                <div className="ledger__row" key={entry.id}>
                  <div className="ledger__main">
                    <span className="ledger__reason">{entry.reason || 'Adjustment'}</span>
                    <span className="ledger__date">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`ledger__delta ${entry.delta >= 0 ? 'is-pos' : 'is-neg'}`}>
                    {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-panel--list" style={{ marginTop: 22 }}>
          <div className="dashboard-form__header">
            <p className="auth-card__eyebrow">History</p>
            <h3>My submissions</h3>
          </div>
          <div className="dashboard-list">
            {submissions.length === 0 ? (
              <p className="dashboard-list__empty">
                No submissions yet. <Link href="/projects/submit">Submit your first fix.</Link>
              </p>
            ) : (
              submissions.map((s) => (
                <article className="dashboard-list__item" key={s.id}>
                  <div className="dashboard-list__item-head">
                    <h4>{s.title}</h4>
                    <span className={`status-badge status-${s.status.toLowerCase()}`}>
                      {s.status}
                      {s.status === 'Approved' && s.pointsAwarded ? ` · +${s.pointsAwarded}` : ''}
                    </span>
                  </div>
                  <p>
                    {s.category}
                    {s.repo ? ` · ${s.repo}` : ''}
                    {s.hackatimeProject ? ` · ${secondsToHours(s.loggedSeconds)}h logged` : ''}
                    {s.hackatimeProject && s.status === 'Submitted' ? ` · ${secondsToPoints(s.loggedSeconds)} pending` : ''}
                  </p>
                  {s.notes ? <p>{s.notes}</p> : null}
                  {s.status === 'Rejected' && s.reviewNote ? (
                    <p className="flash flash--error">Reason: {s.reviewNote}</p>
                  ) : null}
                  <p>
                    <Link href={`/projects/${s.id}`}>
                      {s.status === 'Draft' ? 'Open draft → submit for review' : 'View project / post devlog'}
                    </Link>
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
