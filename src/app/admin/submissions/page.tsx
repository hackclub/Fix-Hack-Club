import { prisma } from '@/lib/db';
import { approveSubmissionAction, rejectSubmissionAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminSubmissions() {
  const pending = await prisma.submission.findMany({
    where: { status: 'Submitted' },
    orderBy: { createdAt: 'asc' },
  });

  const reviewed = await prisma.submission.findMany({
    where: { status: { in: ['Approved', 'Rejected'] } },
    orderBy: { reviewedAt: 'desc' },
    take: 25,
  });

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Review</p>
          <h1 className="dashboard-title">Submissions</h1>
          <p className="dashboard-copy">Approve a fix and set the points to award, or reject it.</p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Queue</p>
          <h3>Pending ({pending.length})</h3>
        </div>

        {pending.length === 0 ? (
          <p className="dashboard-list__empty">Nothing waiting for review.</p>
        ) : (
          <div className="admin-rows">
            {pending.map((s) => (
              <article className="admin-row" key={s.id}>
                <div className="admin-row__main">
                  <h4>{s.title}</h4>
                  <p className="admin-row__meta">
                    {s.category}
                    {s.repo ? ` · ${s.repo}` : ''} · by {s.displayName || s.email || 'Member'}
                  </p>
                  {s.notes ? <p className="admin-row__notes">{s.notes}</p> : null}
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      Open link
                    </a>
                  ) : null}
                </div>
                <div className="admin-row__actions">
                  <form action={approveSubmissionAction} className="inline-form">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      className="points-input"
                      type="number"
                      name="points"
                      min={0}
                      defaultValue={10}
                      aria-label="Points to award"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Approve</button>
                  </form>
                  <form action={rejectSubmissionAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="btn btn-outline btn-sm">Reject</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">History</p>
          <h3>Recently reviewed</h3>
        </div>
        {reviewed.length === 0 ? (
          <p className="dashboard-list__empty">No reviewed submissions yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>By</th>
                <th>Status</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{s.displayName || s.email || 'Member'}</td>
                  <td>
                    <span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span>
                  </td>
                  <td>{s.pointsAwarded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
