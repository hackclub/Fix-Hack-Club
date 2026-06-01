import { airtableConfigured, upsertAirtableRecord } from '../_lib/airtable.js';
import { config } from '../_lib/config.js';
import { buildCookie, getOrigin, json, readCookies, redirect } from '../_lib/http.js';
import {
	createSessionValue,
	exchangeCodeForToken,
	fetchHackClubProfile,
	normalizeHackClubProfile,
} from '../_lib/hackclub.js';

function userFields(profile) {
	return {
		'Hack Club ID': profile.id,
		Email: profile.email,
		'Display Name': profile.display_name,
		'First Name': profile.first_name,
		'Last Name': profile.last_name,
		'Slack ID': profile.slack_id,
		'Verification Status': profile.verification_status,
		Avatar: profile.avatar,
		'Last Signed In At': new Date().toISOString(),
	};
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

		if (airtableConfigured()) {
			await upsertAirtableRecord(
				config.airtableUsersTable,
				[
					{ field: 'Hack Club ID', value: profile.id },
					{ field: 'Email', value: profile.email },
				],
				userFields(profile)
			);
		}

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

		redirect(res, '/#account', 302, {
			'Set-Cookie': [stateCookie, sessionCookie],
		});
	} catch (error) {
		json(res, 500, {
			error: 'Hack Club authentication failed',
			message: error.message,
		});
	}
}
