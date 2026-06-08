import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { getListings } from '@/lib/listings';
import { getSessionProfile } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Find work' };

export default async function FindWorkPage() {
  const [listings, profile] = await Promise.all([getListings(), getSessionProfile()]);
  const open = listings.filter((l) => l.status !== 'finished');
  const finished = listings.filter((l) => l.status === 'finished');
  const ordered = [...open, ...finished];

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Open projects</p>
            <h1 className="dashboard-title">Find work</h1>
            <p className="dashboard-copy">Open things to fix across Hack Club. Pick one, ship a PR, and log your time to earn points.</p>
          </div>
          <div className="btn-row">
            <Link href={profile ? '/projects/submit' : '/api/auth/start'} className="btn btn-primary">
              ⚒ Submit a fix
            </Link>
          </div>
        </div>

        {ordered.length === 0 ? (
          <p className="dashboard-list__empty">No projects listed yet. Check back soon.</p>
        ) : (
          <div className="project-list">
            {ordered.map((listing) => (
              <div className={`ticketA${listing.status === 'finished' ? ' finished' : ''}`} key={listing.id}>
                <div className="ticket-idA">{listing.id}</div>
                <h3>
                  {listing.url ? (
                    <a href={listing.url} target="_blank" rel="noopener noreferrer">
                      {listing.title}
                    </a>
                  ) : (
                    listing.title
                  )}
                </h3>
                {listing.description ? <p>{listing.description}</p> : null}
                {listing.requirements.length ? (
                  <ul>
                    {listing.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="btn-row">
                  {listing.url ? (
                    <a href={listing.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      Page link
                    </a>
                  ) : null}
                  {listing.github_url ? (
                    <a href={listing.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      GitHub repo
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cta-band" style={{ marginTop: 28 }}>
          <div className="cta-band__copy">
            <h2>Want your repo added?</h2>
            <p>Maintain a Hack Club repo that could use some fixes? Get it listed here in Find work — DM Elias on Slack.</p>
          </div>
          <div className="btn-row">
            <a
              href="https://hackclub.enterprise.slack.com/team/U08J9R1TUT1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              DM Elias on Slack
            </a>
          </div>
        </div>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
