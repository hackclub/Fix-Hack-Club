import { prisma } from '../_lib/db.js';
import { config } from '../_lib/config.js';
import { buildCookie, getOrigin, json, readCookies, redirect } from '../_lib/http.js';
import {
	createSessionValue,
	exchangeCodeForToken,
	fetchHackClubProfile,
	normalizeHackClubProfile,
} from '../_lib/hackclub.js';

async function upsertUser(profile) {
	const data = {
		email: profile.email || null,
		displayName: profile.display_name || null,
		firstName: profile.first_name || null,
		lastName: profile.last_name || null,
		slackId: profile.slack_id || null,
		verificationStatus: profile.verification_status || null,
		avatar: profile.avatar || null,
		lastSignedInAt: new Date(),
	};

	await prisma.user.upsert({
		where: { hackClubId: profile.id },
		update: data,
		create: { hackClubId: profile.id, ...data },
	});
}

export default async function handler(req, res) {
	const origin = getOrigin(req);
	const url = new URL(req.url, origin);
	const cookies = readCookies(req.headers.cookie || '');
	const state = url.searchParams.get('state') || '';
	const code = url.searchParams.get('code') || '';
	const storedState = cookies[config.oauthStateCookieName] || '';

	if (!code) {
		json(res, 400, { error: 'Missing OAuth code' });
		return;
	}

	if (!state || !storedState || state !== storedState) {
		json(res, 400, { error: 'OAuth state mismatch' });
		return;
	}

	try {
		const tokenResponse = await exchangeCodeForToken({ code, origin });
		const profilePayload = await fetchHackClubProfile(tokenResponse.access_token || tokenResponse.token || '');
		const profile = normalizeHackClubProfile(profilePayload);

		if (!profile.id) {
			throw new Error('Hack Club profile did not include an identity id');
		}

		await upsertUser(profile);

		const sessionCookie = buildCookie(config.sessionCookieName, createSessionValue(profile), {
			path: '/',
			maxAge: 60 * 60 * 24 * 30,
			httpOnly: true,
			sameSite: 'Lax',
			secure: origin.startsWith('https://'),
		});

		const stateCookie = buildCookie(config.oauthStateCookieName, '', {
			path: '/',
			maxAge: 0,
			httpOnly: true,
			sameSite: 'Lax',
			secure: origin.startsWith('https://'),
		});

		redirect(res, '/dashboard', 302, {
			'Set-Cookie': [stateCookie, sessionCookie],
		});
	} catch (error) {
		json(res, 500, {
			error: 'Hack Club authentication failed',
			message: error.message,
		});
	}
}
