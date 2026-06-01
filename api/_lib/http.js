export function getOrigin(req) {
	const forwardedProto = req.headers['x-forwarded-proto'];
	const forwardedHost = req.headers['x-forwarded-host'];
	const host = forwardedHost || req.headers.host;
	const protocol = forwardedProto || 'https';

	return `${protocol}://${host}`;
}

export function json(res, statusCode, payload, headers = {}) {
	res.statusCode = statusCode;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');

	for (const [key, value] of Object.entries(headers)) {
		res.setHeader(key, value);
	}

	res.end(JSON.stringify(payload));
}

export function redirect(res, location, statusCode = 302, headers = {}) {
	res.statusCode = statusCode;
	res.setHeader('Location', location);

	for (const [key, value] of Object.entries(headers)) {
		res.setHeader(key, value);
	}

	res.end();
}

export function readCookies(cookieHeader = '') {
	return cookieHeader.split(';').reduce((cookies, entry) => {
		const [name, ...valueParts] = entry.trim().split('=');

		if (!name) {
			return cookies;
		}

		cookies[name] = decodeURIComponent(valueParts.join('='));
		return cookies;
	}, {});
}

export function buildCookie(name, value, options = {}) {
	const parts = [`${name}=${encodeURIComponent(value)}`];

	if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
	if (options.domain) parts.push(`Domain=${options.domain}`);
	if (options.path) parts.push(`Path=${options.path}`);
	if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
	if (options.httpOnly !== false) parts.push('HttpOnly');
	if (options.secure) parts.push('Secure');
	if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

	return parts.join('; ');
}
