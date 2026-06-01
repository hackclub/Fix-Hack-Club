import { buildCookie, getOrigin, redirect } from '../_lib/http.js';
import { buildAuthUrl, createState } from '../_lib/hackclub.js';
import { config } from '../_lib/config.js';

export default async function handler(req, res) {
	const origin = getOrigin(req);
	const state = createState();
	const loginHint = new URL(req.url, origin).searchParams.get('login_hint') || '';
	const authUrl = buildAuthUrl({ origin, state, loginHint });

	redirect(res, authUrl, 302, {
		'Set-Cookie': buildCookie(config.oauthStateCookieName, state, {
			path: '/',
			maxAge: 10 * 60,
			httpOnly: true,
			sameSite: 'Lax',
			secure: origin.startsWith('https://'),
		}),
	});
}
