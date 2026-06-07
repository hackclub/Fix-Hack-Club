import Link from 'next/link';
import { prisma } from '@/lib/db';
import { REVIEW_STAGE } from '@/lib/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [awaitingFirst, awaitingFinal, approvedSubs, pendingOrders, listings, items, users] = await Promise.all([
    prisma.submission.count({ where: { status: 'Submitted', reviewStage: REVIEW_STAGE.FIRST } }),
    prisma.submission.count({ where: { status: 'Submitted', reviewStage: REVIEW_STAGE.FINAL } }),
    prisma.submission.count({ where: { status: 'Approved' } }),
    prisma.shopOrder.count({ where: { status: 'pending' } }),
    prisma.listing.count(),
    prisma.shopItem.count(),
    prisma.user.count(),
  ]);

  const cards = [
    { label: 'Awaiting first review', value: awaitingFirst, href: '/review' },
    { label: 'Awaiting your decision', value: awaitingFinal, href: '/admin/submissions' },
    { label: 'Approved fixes', value: approvedSubs, href: '/admin/submissions' },
    { label: 'Orders to fulfill', value: pendingOrders, href: '/admin/orders' },
    { label: 'Listings', value: listings, href: '/admin/listings' },
    { label: 'Shop items', value: items, href: '/admin/shop' },
    { label: 'Members', value: users, href: '/admin/users' },
  ];

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Admin</p>
          <h1 className="dashboard-title">Overview</h1>
          <p className="dashboard-copy">Review submissions, manage the shop, and keep things moving.</p>
        </div>
      </div>

      <div className="admin-cards">
        {cards.map((card) => (
          <Link className="admin-card" href={card.href} key={card.label}>
            <span className="admin-card__value">{card.value}</span>
            <span className="admin-card__label">{card.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
