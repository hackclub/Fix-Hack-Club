import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { prisma } from '@/lib/db';
import { formatPoints } from '@/lib/hackatime';
import { getDbUser, getSessionProfile } from '@/lib/session';
import { redeemAction } from '../../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = { title: 'FixHC - Redeem' };

const GRANT_TYPES = ['Food Grant', 'Other'];
const FULFILMENTS = ['HCB Organization', 'Digital Card', 'Reimbursement'];

export default async function RedeemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/api/auth/start');
  }

  const { id } = await params;
  const sp = await searchParams;
  const [user, item] = await Promise.all([
    getDbUser(),
    prisma.shopItem.findUnique({ where: { id } }),
  ]);

  if (!item || !item.active) {
    notFound();
  }

  const soldOut = item.stock !== null && item.stock <= 0;
  const balance = user?.balance ?? 0;
  if (soldOut) {
    redirect(`/shop?error=${encodeURIComponent('This item is out of stock.')}`);
  }
  if (balance < item.cost) {
    redirect(`/shop?error=${encodeURIComponent('You do not have enough points for this item.')}`);
  }

  return (
    <div className="dash-body">
      <div className="caution-tape"></div>
      <SiteHeader />

      <main className="dash-shell">
        <div className="dash-pagehead">
          <div className="dash-pagehead__copy">
            <p className="auth-card__eyebrow">Redeem</p>
            <h1 className="dashboard-title">{item.name}</h1>
            <p className="dashboard-copy">
              {formatPoints(item.cost)} pts · your balance {formatPoints(balance)} pts. Tell us how to fulfil your grant and where to send it.
            </p>
          </div>
          <Link href="/shop" className="btn btn-outline">← Back to shop</Link>
        </div>

        {sp.error ? <p className="flash flash--error">{sp.error}</p> : null}

        <section className="dashboard-panel">
          <form action={redeemAction} className="dashboard-form">
            <input type="hidden" name="itemId" value={item.id} />

            <div className="dashboard-form__header">
              <p className="auth-card__eyebrow">Grant info</p>
              <h3>How should we fulfil this?</h3>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Grant type *</span>
                <select name="grantType" defaultValue="">
                  <option value="" disabled>Select…</option>
                  {GRANT_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Fulfilment *</span>
                <select name="fulfilment" defaultValue="">
                  <option value="" disabled>Select…</option>
                  {FULFILMENTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            </div>

            <div className="dashboard-form__header" style={{ marginTop: 8 }}>
              <p className="auth-card__eyebrow">Shipping address</p>
              <h3>Where should it go?</h3>
            </div>
            <label className="field"><span>Address (Line 1) *</span><input name="addressLine1" /></label>
            <label className="field"><span>Address (Line 2)</span><input name="addressLine2" /></label>
            <div className="form-grid">
              <label className="field"><span>City *</span><input name="city" /></label>
              <label className="field"><span>State / Province *</span><input name="state" /></label>
              <label className="field"><span>ZIP / Postal code *</span><input name="zip" /></label>
              <label className="field"><span>Country *</span><input name="country" /></label>
            </div>

            <button type="submit" className="btn btn-primary dashboard-form__button">
              Redeem for {formatPoints(item.cost)} pts
            </button>
          </form>
        </section>
      </main>

      <div className="caution-tape"></div>
    </div>
  );
}
