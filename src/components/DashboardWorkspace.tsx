'use client';

import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import type { HackClubProfile, SubmissionDTO } from '@/lib/types';

export default function DashboardWorkspace({ user }: { user: HackClubProfile }) {
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [feedback, setFeedback] = useState('Fill out the form to log a contribution.');
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const displayName = user.display_name || user.first_name || user.email || 'Hack Club member';
  const firstName = displayName.split(' ')[0];

  const loadSubmissions = useCallback(async () => {
    try {
      const response = await fetch('/api/submissions', { credentials: 'include' });
      const data = response.ok ? await response.json() : { submissions: [] };
      setSubmissions(data.submissions ?? []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('Submitting...');

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      form.reset();
      setFeedback('Submitted. Your contribution has been logged.');
      await loadSubmissions();
    } catch (error) {
      setFeedback((error as Error).message || 'Could not submit right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.querySelector(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="dash-app">
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Your workspace</p>
          <h1 className="dashboard-title">Welcome back, {firstName}</h1>
          <p className="dashboard-copy">
            Submit a fix, then track its status below. Everything is saved to the FixHC database.
          </p>
        </div>
        <div className="dash-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Status</span>
            <span className="dashboard-stat__value">Signed in</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Submissions</span>
            <span className="dashboard-stat__value">{submissions.length}</span>
          </div>
        </div>
      </div>

      <div className="dash-layout">
        <aside className="dash-sidebar">
          <nav className="dash-nav" aria-label="Dashboard sections">
            <a className="dash-nav__link" href="#submit" onClick={(e) => scrollTo(e, '#submit')}>
              Submit a fix
            </a>
            <a className="dash-nav__link" href="#mine" onClick={(e) => scrollTo(e, '#mine')}>
              My submissions
            </a>
            <a className="dash-nav__link" href="#profile" onClick={(e) => scrollTo(e, '#profile')}>
              Profile
            </a>
          </nav>
          <div className="dashboard-panel dashboard-panel--summary dashboard-panel--summary-alt">
            <p className="auth-card__eyebrow">Quick flow</p>
            <ol className="dashboard-steps">
              <li>Find something to improve.</li>
              <li>Open a PR on the repo.</li>
              <li>Log it here to track the grant.</li>
            </ol>
          </div>
        </aside>

        <div className="dash-main">
          <section className="dashboard-panel dashboard-form-wrap" id="submit">
            <div className="dashboard-form__header">
              <p className="auth-card__eyebrow">Submit work</p>
              <h3>Send a contribution</h3>
            </div>

            <form className="dashboard-form is-active" onSubmit={handleSubmit}>
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
                <span>Notes</span>
                <textarea name="notes" rows={4} placeholder="What needs to change, what you tried, and any helpful context." />
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

              <p className="dashboard-form__feedback">{feedback}</p>
              <button type="submit" className="btn btn-primary dashboard-form__button" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit contribution'}
              </button>
            </form>
          </section>

          <section className="dashboard-panel dashboard-panel--list" id="mine">
            <div className="dashboard-form__header">
              <p className="auth-card__eyebrow">Recent submissions</p>
              <h3>Your latest items</h3>
            </div>
            <div className="dashboard-list">
              {!loaded ? (
                <p className="dashboard-list__empty">Loading your submissions...</p>
              ) : submissions.length === 0 ? (
                <p className="dashboard-list__empty">No submissions yet. Log your first fix above.</p>
              ) : (
                submissions.map((submission) => (
                  <article className="dashboard-list__item" key={submission.id}>
                    <div className="dashboard-list__item-head">
                      <h4>{submission.title}</h4>
                      <span>{submission.status || submission.category || 'Submitted'}</span>
                    </div>
                    <p>{submission.notes || 'No notes provided.'}</p>
                    {submission.url ? (
                      <a href={submission.url} target="_blank" rel="noopener noreferrer">
                        Open link
                      </a>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-panel dashboard-panel--summary" id="profile">
            <p className="auth-card__eyebrow">Hack Club identity</p>
            <h3>Profile</h3>
            <dl className="dash-profile">
              <div className="dash-profile__row">
                <dt>Name</dt>
                <dd>{displayName}</dd>
              </div>
              <div className="dash-profile__row">
                <dt>Email</dt>
                <dd>{user.email || 'Not provided'}</dd>
              </div>
              <div className="dash-profile__row">
                <dt>Verification</dt>
                <dd>{user.verification_status ? user.verification_status.replace(/_/g, ' ') : 'Unknown'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
