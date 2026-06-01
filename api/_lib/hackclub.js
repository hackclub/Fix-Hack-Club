import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

export function getRedirectUri(origin) {
	return `${origin}/api/auth/callback`;
}

export function buildAuthUrl({ origin, state, loginHint } = {}) {
	if (!config.authClientId) {
		throw new Error('HACKCLUB_CLIENT_ID is not configured');
	}

	const url = new URL('/oauth/authorize', config.authHost);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', config.authClientId);
	url.searchParams.set('redirect_uri', getRedirectUri(origin));
	url.searchParams.set('scope', config.authScope);

	if (state) {
		url.searchParams.set('state', state);
	}

	if (loginHint) {
		url.searchParams.set('login_hint', loginHint);
	}

	return url.toString();
}

export function createState() {
	return randomUUID();
}

export async function exchangeCodeForToken({ code, origin }) {
	const response = await fetch(new URL('/oauth/token', config.authHost), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			client_id: config.authClientId,
			client_secret: config.authClientSecret,
			redirect_uri: getRedirectUri(origin),
		}),
	});

	if (!response.ok) {
		throw new Error(`OAuth token exchange failed with status ${response.status}`);
	}

	return response.json();
}

export async function fetchHackClubProfile(accessToken) {
	const response = await fetch(new URL('/api/v1/me', config.authHost), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Hack Club profile request failed with status ${response.status}`);
	}

	return response.json();
}

export function normalizeHackClubProfile(payload) {
	const identity = payload?.identity || {};

	return {
		id: identity.id?.toString() || payload?.id?.toString() || '',
		email: identity.primary_email?.toString().toLowerCase() || payload?.email?.toString().toLowerCase() || '',
		first_name: identity.first_name?.toString() || payload?.first_name?.toString() || '',
		last_name: identity.last_name?.toString() || payload?.last_name?.toString() || '',
		display_name: identity.display_name?.toString() || identity.first_name?.toString() || payload?.name?.toString() || payload?.email?.toString() || 'Hack Club member',
		slack_id: identity.slack_id?.toString() || payload?.slack_id?.toString() || '',
		verification_status: identity.verification_status?.toString() || payload?.verification_status?.toString() || '',
		avatar: identity.avatar_url?.toString() || payload?.avatar_url?.toString() || '',
	};
}

function sign(value) {
	return createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

export function createSessionValue(profile) {
	const payload = Buffer.from(JSON.stringify(profile)).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

export function readSessionValue(value) {
	if (!value) {
		return null;
	}

	const [payload, signature] = value.split('.');
	if (!payload || !signature) {
		return null;
	}

	const expected = sign(payload);

	if (signature.length !== expected.length) {
		return null;
	}

	try {
		if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
			return null;
		}

		return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
	} catch {
		return null;
	}
}
