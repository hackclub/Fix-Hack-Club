import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { formatPoints } from '@/lib/hackatime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Ships' };

export default async function ShipsPage() {
  const submissions = await prisma.submission.findMany({
    where: { status: 'Approved' },
    orderBy: [{ reviewedAt: 'desc' }, { createdAt: 'desc' }],
    take: 40,
  });

  const ids = Array.from(new Set(submissions.map((s) => s.hackClubId)));
  const authors = await prisma.user.findMany({ where: { hackClubId: { in: ids } } });
  const byHackClubId = new Map(authors.map((u) => [u.hackClubId, u]));

  const leaders = await prisma.user.findMany({
    where: { totalEarned: { gt: 0 } },
    orderBy: { totalEarned: 'desc' },
    take: 10,
  });

  // Count each leader's shipped (approved) fixes for the leaderboard.
  const leaderIds = leaders.map((u) => u.hackClubId);
  const shipCounts = leaderIds.length
    ? await prisma.submission.groupBy({
        by: ['hackClubId'],
        where: { status: 'Approved', hackClubId: { in: leaderIds } },
        _count: { _all: true },
      })
    : [];
  const shipsByHackClubId = new Map(shipCounts.map((c) => [c.hackClubId, c._count._all]));

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Community</p>
            <h1 className="dashboard-title">Ships</h1>
            <p className="dashboard-copy">Shipped fixes from across the FixHC community.</p>
          </div>
        </div>

        <div className="feed-layout">
          <div className="dash-main">
            {submissions.length === 0 ? (
              <p className="dashboard-list__empty">No shipped fixes yet. Be the first to ship one.</p>
            ) : (
              <div className="feed">
                {submissions.map((s) => {
                  const author = byHackClubId.get(s.hackClubId);
                  return (
                    <article className="feed-item" key={s.id}>
                      <div className="feed-item__head">
                        <h3 className="feed-item__title">
                          <Link href={`/projects/${s.id}`}>{s.title}</Link>
                        </h3>
                        <span className="balance-pill">+{formatPoints(s.pointsAwarded)} pts</span>
                      </div>
                      {s.notes ? <p className="feed-item__notes">{s.notes}</p> : null}
                      <div className="feed-item__meta">
                        <span className="feed-tag">{s.category}</span>
                        {s.repo ? <span className="feed-repo">{s.repo}</span> : null}
                        <span className="feed-by">
                          by{' '}
                          {author ? (
                            <Link href={`/u/${author.id}`}>{author.displayName || 'Member'}</Link>
                          ) : (
                            s.displayName || 'Member'
                          )}
                        </span>
                        <Link href={`/projects/${s.id}`}>View project</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="dash-sidebar">
            <div className="dashboard-panel dashboard-panel--summary">
              <p className="auth-card__eyebrow">Leaderboard</p>
              <h3>Top contributors</h3>
              {leaders.length === 0 ? (
                <p className="dashboard-list__empty">No points awarded yet.</p>
              ) : (
                <ol className="leaderboard">
                  {leaders.map((u, i) => {
                    const ships = shipsByHackClubId.get(u.hackClubId) ?? 0;
                    return (
                      <li className="leaderboard__row" key={u.id}>
                        <span className="leaderboard__rank">{i + 1}</span>
                        <div className="leaderboard__person">
                          <Link className="leaderboard__name" href={`/u/${u.id}`}>
                            {u.displayName || 'Member'}
                          </Link>
                          <span className="leaderboard__sub">
                            {ships} {ships === 1 ? 'ship' : 'ships'}
                          </span>
                        </div>
                        <span className="leaderboard__pts">{formatPoints(u.totalEarned)} pts</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
