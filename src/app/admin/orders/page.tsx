import Link from 'next/link';
import { requireAdminOnly } from '@/lib/access';
import { prisma } from '@/lib/db';
import { fulfillOrderAction, refundOrderAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function personName(user: { displayName: string | null; email: string | null } | null): string {
  return user?.displayName || user?.email || 'Member';
}

export default async function AdminOrders() {
  await requireAdminOnly();

  const [pending, processed] = await Promise.all([
    prisma.shopOrder.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    }),
    prisma.shopOrder.findMany({
      where: { status: { in: ['fulfilled', 'rejected'] } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: { user: true },
    }),
  ]);

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Fulfillment</p>
          <h1 className="dashboard-title">Orders</h1>
          <p className="dashboard-copy">Work the queue top-to-bottom: fulfill a redemption (optionally with a code/note) or refund it to return points and stock.</p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Queue</p>
          <h3>To process ({pending.length})</h3>
        </div>

        {pending.length === 0 ? (
          <p className="dashboard-list__empty">All caught up — no orders waiting.</p>
        ) : (
          <div className="admin-rows">
            {pending.map((order) => (
              <article className="admin-row" key={order.id}>
                <div className="admin-row__main">
                  <h4>{order.itemName}</h4>
                  <p className="admin-row__meta">
                    <strong>{order.cost} pts</strong>
                    {' · '}
                    {order.user ? (
                      <Link href={`/u/${order.user.id}`}>{personName(order.user)}</Link>
                    ) : (
                      'Member'
                    )}
                    {' · '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="admin-row__actions">
                  <form action={fulfillOrderAction} className="inline-form">
                    <input type="hidden" name="id" value={order.id} />
                    <input className="note-input" name="note" placeholder="Code / note (optional)" />
                    <button type="submit" className="btn btn-primary btn-sm">Fulfill</button>
                  </form>
                  <form action={refundOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="btn btn-outline btn-sm">Refund</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">History</p>
          <h3>Recently processed</h3>
        </div>
        {processed.length === 0 ? (
          <p className="dashboard-list__empty">Nothing processed yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>By</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {processed.map((order) => (
                <tr key={order.id}>
                  <td>{order.itemName}</td>
                  <td>{personName(order.user)}</td>
                  <td>{order.cost}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status === 'rejected' ? 'refunded' : order.status}
                    </span>
                  </td>
                  <td>{order.fulfillmentNote || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
