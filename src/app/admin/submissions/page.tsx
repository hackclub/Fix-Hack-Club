import Link from 'next/link';
import { requireAdminOnly } from '@/lib/access';
import { prisma } from '@/lib/db';
import { formatPoints, secondsToHours, secondsToPoints } from '@/lib/hackatime';
import { REJECTION_REASONS, REVIEW_STAGE } from '@/lib/reviews';
import { approveSubmissionAction, rejectSubmissionAction, setOverrideHoursAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminSubmissions() {
  await requireAdminOnly();

  // Final review queue: a reviewer has made a first-grade recommendation and the
  // submission is awaiting the admin's final call.
  const pending = await prisma.submission.findMany({
    where: { status: 'Submitted', reviewStage: REVIEW_STAGE.FINAL },
    orderBy: { firstReviewedAt: 'asc' },
    include: { _count: { select: { devlogs: true } } },
  });

  // How many are still waiting for a first-grade review (reviewers, or an admin).
  const awaitingFirst = await prisma.submission.count({
    where: { status: 'Submitted', reviewStage: REVIEW_STAGE.FIRST },
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
          <p className="auth-card__eyebrow">Final review</p>
          <h1 className="dashboard-title">Submissions</h1>
          <p className="dashboard-copy">
            A reviewer has taken a first look — their recommendation is shown below. You make the final call: approve and set the points, or reject with a reason.
          </p>
        </div>
        <div className="btn-row">
          <a className="btn btn-outline btn-sm" href="/admin/submissions/export">⬇ Export review CSV</a>
        </div>
      </div>

      {awaitingFirst > 0 ? (
        <p className="flash">
          {awaitingFirst} submission{awaitingFirst === 1 ? '' : 's'} still awaiting a first-grade review.{' '}
          <Link href="/admin/review">Open the review queue →</Link>
        </p>
      ) : null}

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Queue</p>
          <h3>Awaiting your decision ({pending.length})</h3>
        </div>

        {pending.length === 0 ? (
          <p className="dashboard-list__empty">Nothing waiting for a final decision.</p>
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
                  <p className="admin-row__meta">
                    Reviewer recommendation:{' '}
                    <span className={`status-badge status-${(s.firstReviewStatus || 'submitted').toLowerCase()}`}>
                      {s.firstReviewStatus === 'Approved' ? 'Approve' : s.firstReviewStatus === 'Rejected' ? 'Deny' : 'Pending'}
                    </span>
                    {s.firstReviewNote ? ` · ${s.firstReviewNote}` : ''}
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
                  <form action={approveSubmissionAction} className="inline-form">
                    <input type="hidden" name="id" value={s.id} />
                    {s.hackatimeProject ? null : (
                      <input
                        className="points-input"
                        type="number"
                        name="points"
                        min={0}
                        step={0.1}
                        defaultValue={10}
                        aria-label="Points to award"
                      />
                    )}
                    <button type="submit" className="btn btn-primary btn-sm">
                      {s.hackatimeProject ? 'Approve (pay hours)' : 'Approve'}
                    </button>
                  </form>
                  <form action={rejectSubmissionAction} className="inline-form">
                    <input type="hidden" name="id" value={s.id} />
                    <select className="note-input" name="reason" defaultValue={REJECTION_REASONS[0]} aria-label="Rejection reason">
                      {REJECTION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-outline btn-sm">Reject</button>
                  </form>
                  <form action={setOverrideHoursAction} className="inline-form">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      className="points-input"
                      type="number"
                      name="overrideHours"
                      min={0}
                      step={0.1}
                      defaultValue={s.overrideHours ?? ''}
                      placeholder="Override hrs"
                      aria-label="Override hours spent (optional)"
                    />
                    <input
                      className="note-input"
                      name="overrideJustification"
                      defaultValue={s.overrideHoursJustification ?? ''}
                      placeholder="Override justification"
                      aria-label="Override hours justification"
                    />
                    <button type="submit" className="btn btn-outline btn-sm">Save hours</button>
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
                <th>Reason</th>
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
                  <td>{formatPoints(s.pointsAwarded)}</td>
                  <td>{s.status === 'Rejected' ? s.reviewNote || '—' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
