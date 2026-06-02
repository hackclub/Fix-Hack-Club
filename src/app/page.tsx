import SiteHeader from '@/components/SiteHeader';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';

const howSteps = [
  { id: 'STEP-01', n: '01', title: 'Find It', body: 'Browse open projects — broken things to fix, designs to improve, or missing content worth adding.' },
  { id: 'STEP-02', n: '02', title: 'Fix It', body: 'Fork the repo, make your changes, and open a Pull Request.' },
  { id: 'STEP-03', n: '03', title: 'Ship It', body: 'Work with Hack Club staff to get your PR reviewed and merged. Shipped = quest complete.' },
  { id: 'STEP-04', n: '04', title: 'Claim It', body: 'Earn points based on the time and impact of your work — then spend them in the shop.' },
];

export default function Home() {
  return (
    <div className="dash-body">
      <div className="caution-tape" id="top"></div>

      <SiteHeader />

      <header className="hero">
        <span className="hero-kicker">⚒ Hack Club PullQuest</span>
        <h1>
          <span className="yellow">Fix</span>
          <br />
          <span className="outline">Hack Club</span>
        </h1>
        <p className="hero-desc">
          Submit PRs to improve Hack Club&apos;s infra. Fix CSS, add pages to YSWS programs, or anything else approved by the program managers — and earn points for your time.
        </p>
        <div className="btn-row">
          <a href="/find" className="btn btn-primary">
            ⚒ Find work
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
        <p className="hero-note">Sign in with Hack Club to submit fixes and track your contributions.</p>
      </header>

      <div className="tape-divider"></div>

      <main>
        <div className="section" id="how">
          <div className="section-inner">
            <div className="section-label">How it works</div>
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

        <div className="section">
          <div className="cta-band">
            <div className="cta-band__copy">
              <h2>Ready to ship something?</h2>
              <p>Pick an open project, open a PR, and log your work. New here? Read the contribution guide first.</p>
            </div>
            <div className="btn-row">
              <a href="/find" className="btn btn-primary">See open projects</a>
              <a
                href="https://github.com/hackclub/.github/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Read CONTRIBUTING.md
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
    </div>
  );
}
