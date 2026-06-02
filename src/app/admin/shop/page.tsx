import { prisma } from '@/lib/db';
import { createShopItemAction, deleteShopItemAction, updateShopItemAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminShop() {
  const items = await prisma.shopItem.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Manage</p>
          <h1 className="dashboard-title">Shop items</h1>
          <p className="dashboard-copy">Rewards members can redeem with points. Leave stock blank for unlimited.</p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">New</p>
          <h3>Add an item</h3>
        </div>
        <form action={createShopItemAction} className="admin-form">
          <label className="field"><span>Name</span><input name="name" required /></label>
          <label className="field"><span>Description</span><textarea name="description" rows={2} /></label>
          <label className="field"><span>Image URL (optional)</span><input name="imageUrl" type="url" /></label>
          <div className="admin-form__row">
            <label className="field"><span>Cost (points)</span><input name="cost" type="number" min={0} defaultValue={100} /></label>
            <label className="field"><span>Stock (blank = unlimited)</span><input name="stock" type="number" min={0} /></label>
          </div>
          <label className="checkbox-field"><input type="checkbox" name="active" defaultChecked /> <span>Active</span></label>
          <button type="submit" className="btn btn-primary">Create item</button>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Existing</p>
          <h3>{items.length} item(s)</h3>
        </div>

        {items.length === 0 ? (
          <p className="dashboard-list__empty">No items yet.</p>
        ) : (
          items.map((item) => (
            <details className="admin-collapse" key={item.id}>
              <summary className="admin-collapse__summary">
                <span className="admin-collapse__title">
                  {item.name}
                  {!item.active ? <span className="status-badge status-rejected">Hidden</span> : null}
                </span>
                <span className="admin-collapse__meta">
                  <span className="balance-pill">{item.cost} pts</span>
                  <span className="btn btn-outline btn-sm admin-collapse__edit">Edit</span>
                </span>
              </summary>

              <form action={updateShopItemAction} className="admin-form admin-collapse__form">
                <input type="hidden" name="id" value={item.id} />
                <label className="field"><span>Name</span><input name="name" defaultValue={item.name} /></label>
                <label className="field"><span>Description</span><textarea name="description" rows={2} defaultValue={item.description} /></label>
                <label className="field"><span>Image URL</span><input name="imageUrl" defaultValue={item.imageUrl ?? ''} /></label>
                <div className="admin-form__row">
                  <label className="field"><span>Cost</span><input name="cost" type="number" min={0} defaultValue={item.cost} /></label>
                  <label className="field"><span>Stock</span><input name="stock" type="number" min={0} defaultValue={item.stock ?? ''} /></label>
                </div>
                <label className="checkbox-field"><input type="checkbox" name="active" defaultChecked={item.active} /> <span>Active</span></label>
                <div className="admin-row__actions">
                  <button type="submit" className="btn btn-primary btn-sm" formAction={updateShopItemAction}>Save</button>
                  <button type="submit" className="btn btn-outline btn-sm" formAction={deleteShopItemAction}>Delete</button>
                </div>
              </form>
            </details>
          ))
        )}
      </section>
    </>
  );
}
