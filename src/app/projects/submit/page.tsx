import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SubmitWizard from '@/components/SubmitWizard';
import { getDbUser, getSessionProfile } from '@/lib/session';
import { fetchHackatimeProjects } from '@/lib/hackatime';
import { submitFixAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Submit a fix' };

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const sp = await searchParams;
  const user = await getDbUser();
  const connected = Boolean(user?.hackatimeUserId);
  const projects = connected ? await fetchHackatimeProjects(user!.hackatimeUserId as string) : [];

  const prefill = {
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email || '',
    githubUsername: '',
    slackId: profile.slack_id || '',
  };

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Submit work</p>
            <h1 className="dashboard-title">Submit a fix</h1>
            <p className="dashboard-copy">A merged PR towards an official Hack Club program. Earn 1 point per hour tracked on a linked Hackatime project.</p>
          </div>
        </div>

        {sp.error ? <p className="flash flash--error">{sp.error}</p> : null}

        <section className="dashboard-panel">
          <SubmitWizard action={submitFixAction} projects={projects} prefill={prefill} connected={connected} />
        </section>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
