import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { secondsToHours } from '@/lib/hackatime';
import { getSessionProfile } from '@/lib/session';
import { postDevlogAction } from '../actions';

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
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">Points</span>
              <span className="dashboard-stat__value">{submission.pointsAwarded}</span>
            </div>
          </div>
        </div>

        {submission.hackatimeProject ? (
          <p className="flash">
            Linked Hackatime project: <strong>{submission.hackatimeProject}</strong>. Post a devlog to log your time, only logged time counts toward points.
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

        {isOwner ? (
          <section className="dashboard-panel">
            <div className="dashboard-form__header">
              <p className="auth-card__eyebrow">Devlog</p>
              <h3>Post an update</h3>
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
                    <span className="balance-pill">{secondsToHours(d.seconds)}h logged</span>
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
