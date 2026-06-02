import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { secondsToHours, secondsToPoints } from '@/lib/hackatime';
import { getSessionProfile } from '@/lib/session';
import { postDevlogAction, submitForReviewAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { devlogs: { orderBy: { createdAt: 'desc' } } },
  });
  if (!submission) {
    notFound();
  }

  const author = await prisma.user.findUnique({ where: { hackClubId: submission.hackClubId } });
  const profile = await getSessionProfile();
  const isOwner = profile?.id === submission.hackClubId;

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Project{author ? ` · by ${author.displayName || 'Member'}` : ''}</p>
            <h1 className="dashboard-title">{submission.title}</h1>
            <p className="dashboard-copy">
              <span className={`status-badge status-${submission.status.toLowerCase()}`}>{submission.status}</span>
              {submission.category ? ` · ${submission.category}` : ''}
              {submission.repo ? ` · ${submission.repo}` : ''}
            </p>
          </div>
          <div className="dash-stats">
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">Logged time</span>
              <span className="dashboard-stat__value">{secondsToHours(submission.loggedSeconds)}h</span>
            </div>
            {submission.status === 'Approved' ? (
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">Points earned</span>
                <span className="dashboard-stat__value">{submission.pointsAwarded}</span>
              </div>
            ) : (
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">Pending points</span>
                <span className="dashboard-stat__value">{secondsToPoints(submission.loggedSeconds)}</span>
              </div>
            )}
          </div>
        </div>

        {isOwner ? (
          <section className="dashboard-panel dashboard-panel--summary">
            <p className="auth-card__eyebrow">Status</p>
            {submission.status === 'Draft' ? (
              <>
                <h3>Draft</h3>
                <p className="dashboard-copy">
                  This fix is a private draft. Keep posting devlogs as you work — when it&apos;s ready, submit it so an admin can review and award points.
                </p>
                <form action={submitForReviewAction}>
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <button type="submit" className="btn btn-primary">⏩ Submit for review</button>
                </form>
              </>
            ) : submission.status === 'Submitted' ? (
              <>
                <h3>In review</h3>
                <p className="dashboard-copy">
                  Submitted for review — an admin will approve or reject it soon. You can still post devlogs while you wait.
                </p>
              </>
            ) : submission.status === 'Rejected' ? (
              <>
                <h3>Not approved</h3>
                <p className="dashboard-copy">
                  This wasn&apos;t approved. Make your changes, then submit it for review again.
                </p>
                <form action={submitForReviewAction}>
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <button type="submit" className="btn btn-primary">⏩ Submit for review again</button>
                </form>
              </>
            ) : (
              <>
                <h3>Approved</h3>
                <p className="dashboard-copy">Shipped and approved — points have been awarded. Nice work!</p>
              </>
            )}
          </section>
        ) : null}

        {submission.hackatimeProject ? (
          <p className="flash">
            Linked Hackatime project: <strong>{submission.hackatimeProject}</strong>. Posting devlogs logs your time and earns pending points (1 per hour). An admin pays them out when this project is approved.
          </p>
        ) : (
          <p className="flash flash--error">No Hackatime project is linked, so coding time cannot be counted for this project.</p>
        )}

        {submission.url ? (
          <p>
            <a href={submission.url} target="_blank" rel="noopener noreferrer">Open the pull request</a>
          </p>
        ) : null}

        {submission.notes ? (
          <section className="dashboard-panel">
            <p className="dashboard-copy">{submission.notes}</p>
          </section>
        ) : null}

        {isOwner && submission.status !== 'Approved' ? (
          <section className="dashboard-panel">
            <div className="dashboard-form__header">
              <p className="auth-card__eyebrow">Devlog</p>
              <h3>Post an update</h3>
              <p className="dashboard-copy">Post a new devlog whenever you work on this. Each one logs the time since your last update.</p>
            </div>
            {sp.error ? <p className="flash flash--error">{sp.error}</p> : null}
            <form action={postDevlogAction} className="dashboard-form is-active">
              <input type="hidden" name="submissionId" value={submission.id} />
              <label className="field">
                <span>What did you work on?</span>
                <textarea name="text" rows={4} required placeholder="Describe what you did since your last update." />
              </label>
              <button type="submit" className="btn btn-primary dashboard-form__button">Post devlog</button>
            </form>
          </section>
        ) : null}

        <section className="dashboard-panel dashboard-panel--list">
          <div className="dashboard-form__header">
            <p className="auth-card__eyebrow">Devlogs</p>
            <h3>{submission.devlogs.length} update(s)</h3>
          </div>
          <div className="dashboard-list">
            {submission.devlogs.length === 0 ? (
              <p className="dashboard-list__empty">No devlogs yet.</p>
            ) : (
              submission.devlogs.map((d) => (
                <article className="dashboard-list__item" key={d.id}>
                  <div className="dashboard-list__item-head">
                    <h4>{new Date(d.createdAt).toLocaleDateString()}</h4>
                    <span className="balance-pill">+{secondsToHours(d.seconds)}h</span>
                  </div>
                  <p>{d.text}</p>
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
