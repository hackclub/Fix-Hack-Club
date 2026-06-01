import { config } from '../_lib/config.js';
import { json, readCookies } from '../_lib/http.js';
import { readSessionValue } from '../_lib/hackclub.js';

export default async function handler(req, res) {
	const cookies = readCookies(req.headers.cookie || '');
	const user = readSessionValue(cookies[config.sessionCookieName]);

	if (!user) {
		json(res, 200, { signedIn: false, user: null });
		return;
	}

	json(res, 200, { signedIn: true, user });
}
