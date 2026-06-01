import { prisma } from './_lib/db.js';
import { json } from './_lib/http.js';

function serializeListing(listing) {
	return {
		id: listing.externalId || listing.id,
		title: listing.title,
		description: listing.description || '',
		requirements: Array.isArray(listing.requirements) ? listing.requirements : [],
		url: listing.url || '',
		github_url: listing.githubUrl || '',
		status: (listing.status || 'active').toLowerCase(),
		completed_at: listing.completedAt ? listing.completedAt.toISOString() : null,
	};
}

export default async function handler(req, res) {
	try {
		const listings = await prisma.listing.findMany({
			orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
		});

		json(res, 200, { listings: listings.map(serializeListing) });
	} catch (error) {
		json(res, 500, {
			error: 'Failed to load listings',
			message: error.message,
			listings: [],
		});
	}
}
