import { requireAdminOnly } from '@/lib/access';
import { prisma } from '@/lib/db';
import { createListingAction, deleteListingAction, updateListingAction } from '../actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminListings() {
  await requireAdminOnly();

  const listings = await prisma.listing.findMany({
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  return (
    <>
      <div className="dash-pagehead">
        <div className="dash-pagehead__copy">
          <p className="auth-card__eyebrow">Manage</p>
          <h1 className="dashboard-title">Listings</h1>
          <p className="dashboard-copy">The fix opportunities shown on the landing page.</p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">New</p>
          <h3>Add a listing</h3>
        </div>
        <form action={createListingAction} className="admin-form">
          <label className="field"><span>Title</span><input name="title" required /></label>
          <label className="field"><span>External ID (optional)</span><input name="externalId" placeholder="LISTING-2" /></label>
          <label className="field"><span>Description</span><textarea name="description" rows={2} /></label>
          <label className="field"><span>Page URL</span><input name="url" type="url" /></label>
          <label className="field"><span>GitHub URL</span><input name="githubUrl" type="url" /></label>
          <label className="field"><span>Requirements (one per line)</span><textarea name="requirements" rows={3} /></label>
          <div className="admin-form__row">
            <label className="field"><span>Status</span>
              <select name="status" defaultValue="active">
                <option value="active">active</option>
                <option value="finished">finished</option>
              </select>
            </label>
            <label className="field"><span>Priority</span><input name="priority" type="number" defaultValue={0} /></label>
          </div>
          <button type="submit" className="btn btn-primary">Create listing</button>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-form__header">
          <p className="auth-card__eyebrow">Existing</p>
          <h3>{listings.length} listing(s)</h3>
        </div>

        {listings.map((l) => (
          <form action={updateListingAction} className="admin-form admin-form--bordered" key={l.id}>
            <input type="hidden" name="id" value={l.id} />
            <label className="field"><span>Title</span><input name="title" defaultValue={l.title} /></label>
            <label className="field"><span>Description</span><textarea name="description" rows={2} defaultValue={l.description} /></label>
            <div className="admin-form__row">
              <label className="field"><span>Page URL</span><input name="url" defaultValue={l.url} /></label>
              <label className="field"><span>GitHub URL</span><input name="githubUrl" defaultValue={l.githubUrl} /></label>
            </div>
            <label className="field"><span>Requirements (one per line)</span><textarea name="requirements" rows={3} defaultValue={l.requirements.join('\n')} /></label>
            <div className="admin-form__row">
              <label className="field"><span>Status</span>
                <select name="status" defaultValue={l.status}>
                  <option value="active">active</option>
                  <option value="finished">finished</option>
                </select>
              </label>
              <label className="field"><span>Priority</span><input name="priority" type="number" defaultValue={l.priority} /></label>
            </div>
            <div className="admin-row__actions">
              <button type="submit" className="btn btn-primary btn-sm" formAction={updateListingAction}>Save</button>
              <button type="submit" className="btn btn-outline btn-sm" formAction={deleteListingAction}>Delete</button>
            </div>
          </form>
        ))}
      </section>
    </>
  );
}
