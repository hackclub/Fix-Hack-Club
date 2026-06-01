import { config } from './config.js';

const AIRTABLE_API = 'https://api.airtable.com/v0';

export function airtableConfigured() {
	return Boolean(config.airtableApiKey && config.airtableBaseId);
}

export async function fetchAirtableTable(tableName) {
	if (!airtableConfigured()) {
		throw new Error('Airtable is not configured');
	}

	const records = [];
	let offset;

	do {
		const url = new URL(`${AIRTABLE_API}/${config.airtableBaseId}/${encodeURIComponent(tableName)}`);
		url.searchParams.set('pageSize', '100');

		if (offset) {
			url.searchParams.set('offset', offset);
		}

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${config.airtableApiKey}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Airtable request failed with status ${response.status}`);
		}

		const payload = await response.json();
		records.push(...(payload.records || []));
		offset = payload.offset;
	} while (offset);

	return records;
}

export async function upsertAirtableRecord(tableName, matches, fields) {
	if (!airtableConfigured()) {
		return null;
	}

	const records = await fetchAirtableTable(tableName);
	const existing = records.find((record) =>
		matches.some((matcher) => record.fields?.[matcher.field] === matcher.value)
	);

	const path = existing
		? `${AIRTABLE_API}/${config.airtableBaseId}/${encodeURIComponent(tableName)}/${existing.id}`
		: `${AIRTABLE_API}/${config.airtableBaseId}/${encodeURIComponent(tableName)}`;

	const response = await fetch(path, {
		method: existing ? 'PATCH' : 'POST',
		headers: {
			Authorization: `Bearer ${config.airtableApiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ fields }),
	});

	if (!response.ok) {
		throw new Error(`Airtable upsert failed with status ${response.status}`);
	}

	return response.json();
}
