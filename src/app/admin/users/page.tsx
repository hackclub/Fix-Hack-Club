import { requireAdminOnly } from '@/lib/access';
import { prisma } from '@/lib/db';
import { isAdminId } from '@/lib/admin';
import { formatPoints } from '@/lib/hackatime';
import { adjustBalanceAction, setReviewerRoleAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  await requireAdminOnly();

  const users = await prisma.user.findMany({
    orderBy: [{ totalEarned: 'desc' }, { createdAt: 'asc' }],
    take: 200,
  });

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">People</p>
          <h1 className="dashboard-title">Users</h1>
          <p className="dashboard-copy">
            Balances, point adjustments, and reviewer access. The Admin role is controlled by the ADMIN_HACK_CLUB_IDS env var; reviewers are granted here.
          </p>
        </div>
      </div>

      <section className="dashboard-panel">
        {users.length === 0 ? (
          <p className="dashboard-list__empty">No members yet.</p>
        ) : (
          <div className="admin-rows">
            {users.map((u) => {
              const isAdmin = u.role === 'ADMIN' || isAdminId(u.hackClubId);
              const isReviewer = u.role === 'REVIEWER';
              return (
                <article className="admin-row" key={u.id}>
                  <div className="admin-row__main">
                    <h4>
                      {u.displayName || 'Member'}{' '}
                      {isAdmin ? <span className="status-badge status-approved">Admin</span> : null}
                      {isReviewer ? <span className="status-badge status-submitted">Reviewer</span> : null}
                    </h4>
                    <p className="admin-row__meta">
                      {u.email || 'no email'} · balance {formatPoints(u.balance)} · earned {formatPoints(u.totalEarned)}
                    </p>
                  </div>
                  <div className="admin-row__actions">
                    {!isAdmin ? (
                      <form action={setReviewerRoleAction} className="inline-form">
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="makeReviewer" value={isReviewer ? '0' : '1'} />
                        <button type="submit" className={`btn btn-sm ${isReviewer ? 'btn-outline' : 'btn-primary'}`}>
                          {isReviewer ? 'Remove reviewer' : 'Make reviewer'}
                        </button>
                      </form>
                    ) : null}
                    <form action={adjustBalanceAction} className="inline-form">
                      <input type="hidden" name="userId" value={u.id} />
                      <input className="points-input" type="number" name="delta" step={0.1} placeholder="+/-" aria-label="Point delta" />
                      <input className="note-input" name="reason" placeholder="Reason" />
                      <button type="submit" className="btn btn-primary btn-sm">Adjust</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
