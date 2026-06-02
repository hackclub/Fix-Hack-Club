import Link from 'next/link';
import { prisma } from '@/lib/db';
import { secondsToHours, secondsToPoints } from '@/lib/hackatime';
import { getDbUser, getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const profile = await getSessionProfile();
  if (!profile) {
    return null;
  }

  const user = await getDbUser();
  const [total, approved, pending, pendingSubs] = await Promise.all([
    prisma.submission.count({ where: { hackClubId: profile.id } }),
    prisma.submission.count({ where: { hackClubId: profile.id, status: 'Approved' } }),
    prisma.submission.count({ where: { hackClubId: profile.id, status: 'Submitted' } }),
    prisma.submission.findMany({ where: { hackClubId: profile.id, status: 'Submitted' }, select: { loggedSeconds: true } }),
  ]);

  const pendingPoints = pendingSubs.reduce((sum, s) => sum + secondsToPoints(s.loggedSeconds), 0);
  const firstName = (profile.display_name || profile.first_name || 'there').split(' ')[0];

  const stats: { label: string; value: number | string }[] = [
    { label: 'Points', value: user?.balance ?? 0 },
    { label: 'Pending points', value: pendingPoints },
    { label: 'Earned all-time', value: user?.totalEarned ?? 0 },
    { label: 'Approved fixes', value: approved },
    { label: 'Awaiting review', value: pending },
  ];

  if (user?.hackatimeUserId) {
    stats.push({ label: 'Coding time', value: `${secondsToHours(user.hackatimeSeconds)}h` });
  }

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Your workspace</p>
          <h1 className="dashboard-title">Welcome back, {firstName}</h1>
          <p className="dashboard-copy">Submit a fix, watch it get reviewed, and spend the points you earn.</p>
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

      <div className="quick-grid">
        <Link className="quick-card" href="/dashboard/submit">
          <h3>Submit a fix</h3>
          <p>Log a PR you opened so it can be reviewed and rewarded.</p>
        </Link>
        <Link className="quick-card" href="/dashboard/submissions">
          <h3>My submissions ({total})</h3>
          <p>Track the status of everything you have sent in.</p>
        </Link>
        <Link className="quick-card" href="/shop">
          <h3>Visit the shop</h3>
          <p>Spend your points on rewards.</p>
        </Link>
      </div>
    </>
  );
}
