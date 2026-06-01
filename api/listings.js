import { airtableConfigured, fetchAirtableTable } from './_lib/airtable.js';
import { config } from './_lib/config.js';
import { json } from './_lib/http.js';

function toRequirements(value) {
	if (Array.isArray(value)) {
		return value.filter(Boolean).map((item) => item.toString().trim()).filter(Boolean);
	}

	if (typeof value === 'string') {
		return value.split(/\r?\n|\s*;\s*/).map((item) => item.trim()).filter(Boolean);
	}

	return [];
}

function normalizeListing(record, index) {
	const fields = record.fields || {};
	const title = fields.Title || fields.title || fields['Listing Title'] || fields.name || record.id || `Listing ${index + 1}`;
	const description = fields.Description || fields.description || '';
	const url = fields.URL || fields.url || fields['Page URL'] || fields.link || '';
	const githubUrl = fields['GitHub URL'] || fields.github_url || fields.github || fields.repo || '';
	const status = (fields.Status || fields.status || 'active').toString().toLowerCase();
	const completedAt = fields['Completed At'] || fields.completed_at || null;
	const requirements = toRequirements(fields.Requirements || fields.requirements || fields['Requirement'] || fields.notes);

	return {
		id: fields.ID || fields.id || record.id || `listing-${index + 1}`,
		title,
		description,
		requirements,
		url,
		github_url: githubUrl,
		status: status === 'done' ? 'finished' : status,
		completed_at: completedAt,
	};
}

export default async function handler(req, res) {
	if (!airtableConfigured()) {
		json(res, 503, {
			error: 'Airtable is not configured',
			message: 'Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID to load listings from Airtable.',
			listings: [],
		});
		return;
	}

	try {
		const records = await fetchAirtableTable(config.airtableListingsTable);
		const listings = records
			.sort((left, right) => {
				const leftFields = left.fields || {};
				const rightFields = right.fields || {};
				const leftRank = Number(leftFields.Priority || leftFields.priority || leftFields['Sort Order'] || leftFields.sort_order || 0);
				const rightRank = Number(rightFields.Priority || rightFields.priority || rightFields['Sort Order'] || rightFields.sort_order || 0);
				return leftRank - rightRank;
			})
			.map(normalizeListing);

		json(res, 200, { listings });
	} catch (error) {
		json(res, 500, {
			error: 'Failed to load Airtable listings',
			message: error.message,
			listings: [],
		});
	}
}
