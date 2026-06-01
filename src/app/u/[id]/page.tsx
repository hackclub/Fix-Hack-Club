import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    notFound();
  }

  const contributions = await prisma.submission.findMany({
    where: { hackClubId: user.hackClubId, status: 'Approved' },
    orderBy: [{ reviewedAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  const name = user.displayName || 'Hack Club member';

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy profile-head">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar" src={user.avatar} alt="" width={64} height={64} />
            ) : null}
            <div>
              <p className="auth-card__eyebrow">
                Profile{user.role === 'ADMIN' ? ' · Admin' : ''}
              </p>
              <h1 className="dashboard-title">{name}</h1>
              {user.bio ? <p className="dashboard-copy">{user.bio}</p> : null}
            </div>
          </div>
          <div className="dash-stats">
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">Points earned</span>
              <span className="dashboard-stat__value">{user.totalEarned}</span>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">Fixes shipped</span>
              <span className="dashboard-stat__value">{contributions.length}</span>
            </div>
          </div>
        </div>

        <section className="dashboard-panel dashboard-panel--list">
          <div className="dashboard-form__header">
            <p className="auth-card__eyebrow">Contributions</p>
            <h3>Approved fixes</h3>
          </div>
          <div className="dashboard-list">
            {contributions.length === 0 ? (
              <p className="dashboard-list__empty">No approved contributions yet.</p>
            ) : (
              contributions.map((s) => (
                <article className="dashboard-list__item" key={s.id}>
                  <div className="dashboard-list__item-head">
                    <h4>{s.title}</h4>
                    <span>+{s.pointsAwarded} pts</span>
                  </div>
                  <p>
                    {s.category}
                    {s.repo ? ` · ${s.repo}` : ''}
                  </p>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      Open link
                    </a>
                  ) : null}
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
