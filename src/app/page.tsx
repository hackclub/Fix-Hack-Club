import Nav from '@/components/Nav';
import Reveal from '@/components/Reveal';
import { getListings } from '@/lib/listings';

export const dynamic = 'force-dynamic';

const howSteps = [
  { id: 'TICKET-01', n: '01', title: 'Find It', body: 'Find broken things to fix, designs to improve, or missing content you think would be helpful!' },
  { id: 'TICKET-02', n: '02', title: 'Fix It', body: 'Fork the repo. Make your changes, and make a Pull Request!' },
  { id: 'TICKET-03', n: '03', title: 'Ship It', body: 'Work with Hack Club staff to get your PR reviewed and merged. Shipped = quest complete.' },
  { id: 'TICKET-04', n: '04', title: 'Claim It', body: 'Receive a grant depending on the time and effort spent making the PR (Impact is a factor as well!)' },
];

const contributeSteps = [
  { id: 'STEP-01', n: '01', title: 'Fork the Repo', body: 'Open the repository you want to improve and fork it to your GitHub account.' },
  { id: 'STEP-02', n: '02', title: 'Make Changes', body: 'Clone your fork locally, and build your fix or improvement.' },
  { id: 'STEP-03', n: '03', title: 'Open a PR', body: 'Push your branch and open a Pull Request with a clear explanation of your changes.' },
  { id: 'STEP-04', n: '04', title: 'Get Reviewed', body: 'Work with maintainers to polish the PR until it is merged and shipped. Also always follow the code of conduct.' },
];

export default async function Home() {
  const listings = await getListings();

  return (
    <>
      <div className="caution-tape" id="top"></div>

      <Nav />

      <header className="hero">
        <h1>
          <span className="yellow">Fix</span>
          <br />
          <span className="outline">Hack Club</span>
        </h1>
        <p className="hero-desc">
          Submit PRs to improve Hack Club&apos;s infra. Fix CSS, add pages to YSWS programs, or anything else approved by the program managers.
        </p>
        <div className="btn-row">
          <a href="/dashboard" className="btn btn-primary">
            ⚒ Open your dashboard
          </a>
          <a
            href="https://hackclub.enterprise.slack.com/archives/C0ALHGAASLV"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Join #pull-quests
          </a>
          <a href="https://github.com/hackclub/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            Browse Repos
          </a>
        </div>
        <p className="hero-note">Sign in on the dashboard to submit fixes and track your contributions.</p>
      </header>

      <div className="tape-divider"></div>

      <main>
        <div className="section" id="how">
          <div className="section-inner">
            <div className="section-label">How this Works?</div>
            <div className="tickets">
              {howSteps.map((step) => (
                <div className="ticket" key={step.id}>
                  <div className="ticket-id">{step.id}</div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="ticket-num">{step.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tape-divider"></div>

        <div className="section" id="jobs">
          <div className="section-inner">
            <div className="section-label">Job Listings</div>
            <div id="job-listings-container">
              {listings.map((listing) => (
                <div className={`ticketA${listing.status === 'finished' ? ' finished' : ''}`} key={listing.id}>
                  <div className="ticket-idA">{listing.id}</div>
                  <h3>
                    <a href={listing.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#ffffff' }}>
                      {listing.title}
                    </a>
                  </h3>
                  <p>{listing.description}</p>
                  <br />
                  <ul style={{ fontSize: 25 }}>
                    {listing.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                  <div className="btn-row" style={{ marginTop: 50 }}>
                    <a href={listing.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Page Link
                    </a>
                    <a href={listing.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                      Github Repository
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tape-divider"></div>

        <div className="section" id="contribute">
          <div className="section-inner">
            <div className="section-label">Github Contribution Guide</div>
            <div className="tickets">
              {contributeSteps.map((step) => (
                <div className="ticket" key={step.id}>
                  <div className="ticket-id">{step.id}</div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="ticket-num">{step.n}</div>
                </div>
              ))}
            </div>

            <div className="btn-row" style={{ marginTop: '2rem' }}>
              <a
                href="https://github.com/hackclub/.github/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Read CONTRIBUTING.md
              </a>
              <a href="/dashboard" className="btn btn-outline">
                Open Dashboard
              </a>
            </div>
          </div>
        </div>
      </main>

      <div className="caution-tape"></div>

      <footer>
        <span>
          FixHC - a{' '}
          <a href="https://hackclub.com" target="_blank" rel="noopener noreferrer">
            Hack Club
          </a>{' '}
          PullQuest
        </span>
        <span>
          <a href="https://github.com/hackclub" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{' '}
          ·{' '}
          <a href="https://hackclub.com/slack" target="_blank" rel="noopener noreferrer">
            Slack
          </a>{' '}
          ·{' '}
          <a href="https://hackclub.com" target="_blank" rel="noopener noreferrer">
            hackclub.com
          </a>
        </span>
      </footer>

      <Reveal />
    </>
  );
}
