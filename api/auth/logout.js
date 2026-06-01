import { buildCookie, getOrigin, redirect } from '../_lib/http.js';
import { config } from '../_lib/config.js';

export default async function handler(req, res) {
	const origin = getOrigin(req);
	const expired = new Date(0);

	redirect(res, '/#top', 302, {
		'Set-Cookie': [
			buildCookie(config.sessionCookieName, '', {
				path: '/',
				expires: expired,
				httpOnly: true,
				sameSite: 'Lax',
				secure: origin.startsWith('https://'),
			}),
			buildCookie(config.oauthStateCookieName, '', {
				path: '/',
				expires: expired,
				httpOnly: true,
				sameSite: 'Lax',
				secure: origin.startsWith('https://'),
			}),
		],
	});
}
