import { getDbUser, getSessionProfile } from '@/lib/session';
import { fetchHackatimeProjects, secondsToHours } from '@/lib/hackatime';
import { submitFixAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) {
    return null;
  }

  const sp = await searchParams;
  const user = await getDbUser();
  const connected = Boolean(user?.hackatimeUserId);
  const projects = connected ? await fetchHackatimeProjects(user!.hackatimeUserId as string) : [];

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Submit work</p>
          <h1 className="dashboard-title">Submit a fix</h1>
          <p className="dashboard-copy">Log a pull request and link the Hackatime project you worked in. On approval you earn 1 point per hour tracked.</p>
        </div>
      </div>

      {sp.error ? <p className="flash flash--error">{sp.error}</p> : null}
      {!connected ? (
        <p className="flash">
          <a href="/api/hackatime/start">Connect Hackatime</a> to link a project and earn points for your coding time.
        </p>
      ) : null}

      <section className="dashboard-panel">
        <form action={submitFixAction} className="dashboard-form is-active">
          <label className="field">
            <span>Title</span>
            <input name="title" type="text" placeholder="Fix sticky nav on Slack homepage" required />
          </label>

          <label className="field">
            <span>Link</span>
            <input name="url" type="url" placeholder="https://github.com/hackclub/example/pull/123" required />
          </label>

          <label className="field">
            <span>Repo / Project</span>
            <input name="repo" type="text" placeholder="hackclub/slack.hackclub.com" required />
          </label>

          <label className="field">
            <span>Hackatime project</span>
            <select name="hackatimeProject" defaultValue="">
              <option value="">{connected ? 'Not linked (no points)' : 'Connect Hackatime to link'}</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({secondsToHours(p.seconds)}h)
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea name="notes" rows={4} placeholder="What changed, what you tried, and any helpful context." />
          </label>

          <label className="field">
            <span>Category</span>
            <select name="category" defaultValue="Bug fix">
              <option value="Bug fix">Bug fix</option>
              <option value="Design">Design</option>
              <option value="Content">Content</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <button type="submit" className="btn btn-primary dashboard-form__button">Submit contribution</button>
        </form>
      </section>
    </>
  );
}
