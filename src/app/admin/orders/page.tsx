import { prisma } from '@/lib/db';
import { fulfillOrderAction, refundOrderAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  const orders = await prisma.shopOrder.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: { user: true },
  });

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Fulfillment</p>
          <h1 className="dashboard-title">Orders</h1>
          <p className="dashboard-copy">Fulfill redemptions or refund them (refunds return points and stock).</p>
        </div>
      </div>

      <section className="dashboard-panel">
        {orders.length === 0 ? (
          <p className="dashboard-list__empty">No orders yet.</p>
        ) : (
          <div className="admin-rows">
            {orders.map((order) => (
              <article className="admin-row" key={order.id}>
                <div className="admin-row__main">
                  <h4>
                    {order.itemName} <span className={`status-badge status-${order.status}`}>{order.status}</span>
                  </h4>
                  <p className="admin-row__meta">
                    {order.cost} pts · {order.user?.displayName || order.user?.email || 'Member'}
                  </p>
                  {order.fulfillmentNote ? <p className="admin-row__notes">{order.fulfillmentNote}</p> : null}
                </div>
                {order.status === 'pending' ? (
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
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
