import { prisma } from './_lib/db.js';
import { config } from './_lib/config.js';
import { json, readCookies } from './_lib/http.js';
import { readSessionValue } from './_lib/hackclub.js';

function serializeSubmission(submission) {
	return {
		id: submission.id,
		title: submission.title,
		url: submission.url || '',
		repo: submission.repo || '',
		category: submission.category || 'Other',
		notes: submission.notes || '',
		status: submission.status || 'Submitted',
		created_at: submission.createdAt ? submission.createdAt.toISOString() : null,
	};
}

function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let data = '';

		req.on('data', (chunk) => {
			data += chunk;
		});

		req.on('end', () => {
			try {
				resolve(data ? JSON.parse(data) : {});
			} catch (error) {
				reject(error);
			}
		});

		req.on('error', reject);
	});
}

export default async function handler(req, res) {
	const cookies = readCookies(req.headers.cookie || '');
	const user = readSessionValue(cookies[config.sessionCookieName]);

	if (!user) {
		json(res, 401, { error: 'Unauthorized', message: 'Sign in to submit.' });
		return;
	}

	const hackClubId = user.id ? String(user.id) : '';
	const email = user.email ? String(user.email) : '';

	if (req.method === 'GET') {
		try {
			const filters = [];
			if (hackClubId) filters.push({ hackClubId });
			if (email) filters.push({ email });

			const submissions = await prisma.submission.findMany({
				where: filters.length ? { OR: filters } : { hackClubId: '__none__' },
				orderBy: { createdAt: 'desc' },
			});

			json(res, 200, { submissions: submissions.map(serializeSubmission) });
		} catch (error) {
			json(res, 500, { error: 'Unable to load submissions', message: error.message, submissions: [] });
		}
		return;
	}

	if (req.method === 'POST') {
		try {
			const body = await readJsonBody(req);

			if (!body.title || !body.url || !body.repo) {
				json(res, 400, { error: 'Missing required fields', message: 'Title, URL, and repo are required.' });
				return;
			}

			await prisma.submission.create({
				data: {
					hackClubId,
					email,
					displayName: user.display_name || '',
					title: String(body.title),
					url: String(body.url),
					repo: String(body.repo),
					category: body.category ? String(body.category) : 'Other',
					notes: body.notes ? String(body.notes) : '',
					status: 'Submitted',
				},
			});

			json(res, 201, { ok: true });
		} catch (error) {
			json(res, 500, { error: 'Unable to submit', message: error.message });
		}
		return;
	}

	json(res, 405, { error: 'Method not allowed' });
}
