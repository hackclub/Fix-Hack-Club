'use client';

import { useRef, useState, type FormEvent } from 'react';

interface HProject {
  name: string;
  seconds: number;
}

interface Prefill {
  firstName: string;
  lastName: string;
  email: string;
  githubUsername: string;
  slackId: string;
}

const STEPS = ['Info', 'PR', 'Submission'];

const STEP_REQUIRED: string[][] = [
  ['firstName', 'lastName', 'email', 'githubUsername', 'dateOfBirth', 'submissionType'],
  ['title', 'url', 'repo'],
  [],
];

const LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  githubUsername: 'GitHub username',
  dateOfBirth: 'Date of birth',
  submissionType: 'Submission type',
  title: 'Project title',
  url: 'Merged PR URL',
  repo: 'Repo / project',
};

export default function SubmitWizard({
  action,
  projects,
  prefill,
  connected,
}: {
  action: (formData: FormData) => Promise<void>;
  projects: HProject[];
  prefill: Prefill;
  connected: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Record<string, string>>({});

  // Returns an error message for the first invalid field in `names`, or null.
  function validate(names: string[]): string | null {
    const form = formRef.current;
    if (!form) return null;
    const fd = new FormData(form);
    for (const name of names) {
      const value = String(fd.get(name) ?? '').trim();
      if (!value) return `Please fill in: ${LABELS[name] ?? name}.`;
      if (name === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        return 'Please enter a valid email address.';
      }
      if (name === 'url' && !/^https?:\/\//i.test(value)) {
        return 'The PR URL must start with http:// or https://';
      }
    }
    return null;
  }

  function snapshot() {
    const form = formRef.current;
    if (!form) return;
    const entries = Array.from(new FormData(form).entries()).map(([k, v]) => [k, String(v)] as const);
    setReview(Object.fromEntries(entries));
  }

  function next() {
    const message = validate(STEP_REQUIRED[step]);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    const target = Math.min(step + 1, STEPS.length - 1);
    if (target === STEPS.length - 1) snapshot();
    setStep(target);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Validate every step's required fields before letting the server action run.
    const stepZero = validate(STEP_REQUIRED[0]);
    if (stepZero) {
      e.preventDefault();
      setError(stepZero);
      setStep(0);
      return;
    }
    const stepOne = validate(STEP_REQUIRED[1]);
    if (stepOne) {
      e.preventDefault();
      setError(stepOne);
      setStep(1);
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="wizard" noValidate>
      <ol className="wizard__steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`wizard__step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`}
          >
            <span className="wizard__step-num">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {/* Step 1 — Info */}
      <div className="wizard__panel" hidden={step !== 0}>
        <p className="flash">
          <strong>Rules:</strong> PRs must be merged by a program manager before submitting this form, and the
          contribution has to be towards an official Hack Club program.
        </p>
        <div className="form-grid">
          <label className="field"><span>First name *</span><input name="firstName" defaultValue={prefill.firstName} /></label>
          <label className="field"><span>Last name *</span><input name="lastName" defaultValue={prefill.lastName} /></label>
          <label className="field"><span>Email *</span><input name="email" type="email" defaultValue={prefill.email} /></label>
          <label className="field"><span>GitHub username *</span><input name="githubUsername" defaultValue={prefill.githubUsername} placeholder="octocat" /></label>
          <label className="field"><span>Date of birth *</span><input name="dateOfBirth" type="date" /></label>
          <label className="field"><span>Slack ID</span><input name="slackId" defaultValue={prefill.slackId} placeholder="Optional" /></label>
          <label className="field">
            <span>Submission type *</span>
            <select name="submissionType" defaultValue="Individual Submission">
              <option value="Individual Submission">Individual Submission</option>
              <option value="Club Submission">Club Submission</option>
            </select>
          </label>
        </div>

        <div className="dashboard-form__header" style={{ marginTop: 18 }}>
          <p className="auth-card__eyebrow">Shipping address</p>
          <h3>Where prizes ship (optional)</h3>
          <p className="dashboard-copy">Used by the YSWS review program to send rewards. You can fill this in later.</p>
        </div>
        <div className="form-grid">
          <label className="field"><span>Address line 1</span><input name="addressLine1" placeholder="Optional" /></label>
          <label className="field"><span>Address line 2</span><input name="addressLine2" placeholder="Optional" /></label>
          <label className="field"><span>City</span><input name="city" placeholder="Optional" /></label>
          <label className="field"><span>State / Province</span><input name="state" placeholder="Optional" /></label>
          <label className="field"><span>Country</span><input name="country" placeholder="Optional" /></label>
          <label className="field"><span>ZIP / Postal code</span><input name="zip" placeholder="Optional" /></label>
        </div>
      </div>

      {/* Step 2 — PR */}
      <div className="wizard__panel" hidden={step !== 1}>
        {!connected ? (
          <p className="flash">
            <a href="/api/hackatime/start">Connect Hackatime</a> to link a project and earn points for your coding time.
          </p>
        ) : null}
        <label className="field"><span>Project title *</span><input name="title" placeholder="Fix sticky nav on Slack homepage" /></label>
        <label className="field"><span>Merged PR URL *</span><input name="url" type="url" placeholder="https://github.com/hackclub/example/pull/123" /></label>
        <label className="field"><span>Repo / project *</span><input name="repo" placeholder="hackclub/slack.hackclub.com" /></label>
        <label className="field">
          <span>Hackatime project</span>
          <select name="hackatimeProject" defaultValue="">
            <option value="">{connected ? 'Not linked (no points)' : 'Connect Hackatime to link'}</option>
            {projects.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
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
        <label className="field"><span>Playable / demo URL</span><input name="playableUrl" type="url" placeholder="Optional — live page or demo" /></label>
        <label className="field"><span>Screenshot URL</span><input name="screenshotUrl" type="url" placeholder="Optional — link to a screenshot" /></label>
        <label className="field"><span>Description</span><textarea name="description" rows={3} placeholder="What does this fix do? (shown publicly once approved)" /></label>
        <label className="field"><span>How did you hear about this?</span><input name="heardAbout" placeholder="Optional" /></label>
      </div>

      {/* Step 3 — Submission (review) */}
      <div className="wizard__panel" hidden={step !== 2}>
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Review</p>
          <h3>Confirm your submission</h3>
        </div>
        <dl className="dash-profile">
          <div className="dash-profile__row"><dt>Name</dt><dd>{`${review.firstName ?? ''} ${review.lastName ?? ''}`.trim() || '—'}</dd></div>
          <div className="dash-profile__row"><dt>Email</dt><dd>{review.email || '—'}</dd></div>
          <div className="dash-profile__row"><dt>GitHub</dt><dd>{review.githubUsername || '—'}</dd></div>
          <div className="dash-profile__row"><dt>Submission type</dt><dd>{review.submissionType || '—'}</dd></div>
          <div className="dash-profile__row"><dt>Project</dt><dd>{review.title || '—'}</dd></div>
          <div className="dash-profile__row"><dt>PR</dt><dd>{review.url || '—'}</dd></div>
          <div className="dash-profile__row"><dt>Repo</dt><dd>{review.repo || '—'}</dd></div>
          <div className="dash-profile__row"><dt>Playable URL</dt><dd>{review.playableUrl || '—'}</dd></div>
          <div className="dash-profile__row"><dt>Hackatime</dt><dd>{review.hackatimeProject || 'Not linked'}</dd></div>
          <div className="dash-profile__row"><dt>Category</dt><dd>{review.category || 'Bug fix'}</dd></div>
          <div className="dash-profile__row"><dt>Address</dt><dd>{[review.addressLine1, review.city, review.state, review.country].filter(Boolean).join(', ') || '—'}</dd></div>
        </dl>
        <p className="dashboard-copy">Your fix will be created as a draft — post devlogs as you work, then submit it for review.</p>
      </div>

      {error ? <p className="flash flash--error">{error}</p> : null}

      <div className="wizard__nav">
        {step > 0 ? (
          <button type="button" className="btn btn-outline" onClick={back}>← Back</button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={next}>Next →</button>
        ) : (
          <button type="submit" className="btn btn-primary">Submit contribution</button>
        )}
      </div>
    </form>
  );
}
