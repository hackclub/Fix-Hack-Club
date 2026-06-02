import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { secondsToHours, secondsToPoints } from '@/lib/hackatime';
import { getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Projects' };

export default async function ProjectsPage() {
  const profile = await getSessionProfile();

  if (!profile) {
    return (
      <div className="dash-body">
        <div className="caution-tape"></div>
        <SiteHeader />
        <main className="dash-shell">
          <section className="dash-gate">
            <div className="dash-gate__card">
              <p className="auth-card__eyebrow">Your projects</p>
              <h1 className="dash-gate__title">Sign in to see your projects</h1>
              <p className="dash-gate__copy">
                Track every fix you&apos;ve started and submit new ones. New here? Find something to work on first.
              </p>
              <a className="btn btn-primary dash-gate__button" href="/api/auth/start">Sign in with Hack Club</a>
              <a className="dash-gate__back" href="/find">Browse open work</a>
            </div>
          </section>
        </main>
        <div className="caution-tape"></div>
      </div>
    );
  }

  const submissions = await prisma.submission.findMany({
    where: { hackClubId: profile.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Your work</p>
            <h1 className="dashboard-title">Projects</h1>
            <p className="dashboard-copy">Every fix you&apos;ve started — drafts, in review, and shipped.</p>
          </div>
          <div className="btn-row">
            <Link href="/projects/submit" className="btn btn-primary">⚒ Submit a fix</Link>
            <Link href="/find" className="btn btn-outline">Find work</Link>
          </div>
        </div>

        <section className="dashboard-panel dashboard-panel--list">
          <div className="dashboard-list">
            {submissions.length === 0 ? (
              <p className="dashboard-list__empty">
                No projects yet. <Link href="/find">Find something to fix</Link> or <Link href="/projects/submit">submit a fix</Link>.
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
