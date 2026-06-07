import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatPoints, secondsToHours, secondsToPoints } from '@/lib/hackatime';
import { REJECTION_REASONS, REVIEW_STAGE } from '@/lib/reviews';
import { firstApproveAction, firstRejectAction } from './actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ReviewQueue() {
  // Stage 1 queue: submitted fixes that still need a first-grade review.
  const pending = await prisma.submission.findMany({
    where: { status: 'Submitted', reviewStage: REVIEW_STAGE.FIRST },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { devlogs: true } } },
  });

  // Recently first-reviewed: shows your recommendation and where the admin
  // landed (still awaiting them while status is "Submitted").
  const reviewed = await prisma.submission.findMany({
    where: { firstReviewedAt: { not: null } },
    orderBy: { firstReviewedAt: 'desc' },
    take: 25,
  });

  // Reuse the existing status-badge tones (approved/rejected/submitted) so the
  // "Final" column is always styled, even while the admin hasn't decided yet.
  const finalState = (status: string): { label: string; tone: string } => {
    if (status === 'Approved') return { label: 'Approved', tone: 'approved' };
    if (status === 'Rejected') return { label: 'Rejected', tone: 'rejected' };
    return { label: 'Awaiting admin', tone: 'submitted' };
  };

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">First-grade review</p>
          <h1 className="dashboard-title">Review queue</h1>
          <p className="dashboard-copy">
            Take a first look and recommend approve or deny with a reason. An admin makes the final call and awards points.
          </p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Queue</p>
          <h3>Awaiting first review ({pending.length})</h3>
        </div>

        {pending.length === 0 ? (
          <p className="dashboard-list__empty">Nothing waiting for a first review.</p>
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
                  {s.hackatimeProject ? (
                    <p className="admin-row__meta">
                      Hackatime: <strong>{s.hackatimeProject}</strong> · {secondsToHours(s.loggedSeconds)}h logged ({s._count.devlogs} devlog{s._count.devlogs === 1 ? '' : 's'}) · pays {formatPoints(secondsToPoints(s.loggedSeconds))} pts
                    </p>
                  ) : null}
                  <p className="admin-row__meta">
                    <Link href={`/projects/${s.id}`}>Open project</Link>
                    {s.url ? (
                      <>
                        {' · '}
                        <a href={s.url} target="_blank" rel="noopener noreferrer">Open link</a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="admin-row__actions">
                  <form action={firstApproveAction} className="inline-form">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      className="note-input"
                      name="reason"
                      placeholder="Note for the admin (optional)"
                      aria-label="Approval note"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Recommend approve</button>
                  </form>
                  <form action={firstRejectAction} className="inline-form">
                    <input type="hidden" name="id" value={s.id} />
                    <select className="note-input" name="reason" defaultValue={REJECTION_REASONS[0]} aria-label="Denial reason">
                      {REJECTION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-outline btn-sm">Recommend deny</button>
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
          <h3>Recently first-reviewed</h3>
        </div>
        {reviewed.length === 0 ? (
          <p className="dashboard-list__empty">No first reviews yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>By</th>
                <th>Recommendation</th>
                <th>Reason</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {reviewed.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{s.displayName || s.email || 'Member'}</td>
                  <td>
                    <span className={`status-badge status-${(s.firstReviewStatus || 'submitted').toLowerCase()}`}>
                      {s.firstReviewStatus || '—'}
                    </span>
                  </td>
                  <td>{s.firstReviewNote || '—'}</td>
                  <td>
                    <span className={`status-badge status-${finalState(s.status).tone}`}>
                      {finalState(s.status).label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
