import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { formatPoints } from '@/lib/hackatime';
import { getDbUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Shop' };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redeemed?: string }>;
}) {
  const sp = await searchParams;
  const user = await getDbUser();

  const items = await prisma.shopItem.findMany({
    where: { active: true },
    orderBy: { cost: 'asc' },
  });

  const orders = user
    ? await prisma.shopOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    : [];

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Rewards</p>
            <h1 className="dashboard-title">Shop</h1>
            <p className="dashboard-copy">Spend the points you earn from approved fixes.</p>
          </div>
          <div className="dash-stats">
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">Your points</span>
              <span className="dashboard-stat__value">{user ? formatPoints(user.balance) : '--'}</span>
            </div>
          </div>
        </div>

        {sp.error ? <p className="flash flash--error">{sp.error}</p> : null}
        {sp.redeemed ? <p className="flash flash--ok">Redeemed. Check your orders below.</p> : null}
        {!user ? (
          <p className="flash">
            <a href="/api/auth/start">Sign in</a> to redeem rewards.
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className="dashboard-list__empty">No items in the shop yet.</p>
        ) : (
          <div className="shop-grid">
            {items.map((item) => {
              const soldOut = item.stock !== null && item.stock <= 0;
              const canAfford = user ? user.balance >= item.cost : false;
              return (
                <article className="shop-card" key={item.id}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="shop-card__img" src={item.imageUrl} alt="" />
                  ) : (
                    <div className="shop-card__img shop-card__img--placeholder">⚙</div>
                  )}
                  <div className="shop-card__body">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="shop-card__foot">
                      <span className="balance-pill">{formatPoints(item.cost)} pts</span>
                      {item.stock !== null ? (
                        <span className="shop-card__stock">{item.stock} left</span>
                      ) : null}
                    </div>
                    {!user || soldOut || !canAfford ? (
                      <button type="button" className="btn btn-primary shop-card__btn" disabled>
                        {soldOut ? 'Sold out' : !user ? 'Sign in to redeem' : 'Not enough points'}
                      </button>
                    ) : (
                      <Link href={`/shop/redeem/${item.id}`} className="btn btn-primary shop-card__btn">
                        Redeem
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {user ? (
          <section className="dashboard-panel dashboard-panel--list">
            <div className="dashboard-form__header">
              <p className="auth-card__eyebrow">Your orders</p>
              <h3>Recent redemptions</h3>
            </div>
            <div className="dashboard-list">
              {orders.length === 0 ? (
                <p className="dashboard-list__empty">No redemptions yet.</p>
              ) : (
                orders.map((order) => (
                  <article className="dashboard-list__item" key={order.id}>
                    <div className="dashboard-list__item-head">
                      <h4>{order.itemName}</h4>
                      <span className={`status-badge status-${order.status}`}>{order.status}</span>
                    </div>
                    <p>
                      {formatPoints(order.cost)} pts
                      {order.fulfillmentNote ? ` · ${order.fulfillmentNote}` : ''}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
