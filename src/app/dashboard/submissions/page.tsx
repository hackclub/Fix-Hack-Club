import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MySubmissions() {
  const profile = await getSessionProfile();
  if (!profile) {
    return null;
  }

  const submissions = await prisma.submission.findMany({
    where: { hackClubId: profile.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">History</p>
          <h1 className="dashboard-title">My submissions</h1>
          <p className="dashboard-copy">Everything you have submitted and where it stands.</p>
        </div>
      </div>

      <section className="dashboard-panel dashboard-panel--list">
        <div className="dashboard-list">
          {submissions.length === 0 ? (
            <p className="dashboard-list__empty">
              No submissions yet. <Link href="/dashboard/submit">Submit your first fix.</Link>
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
                </p>
                {s.notes ? <p>{s.notes}</p> : null}
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
    </>
  );
}
