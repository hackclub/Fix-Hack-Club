export const config = {
	authHost: process.env.HACKCLUB_AUTH_HOST || 'https://auth.hackclub.com',
	authClientId: process.env.HACKCLUB_CLIENT_ID || '',
	authClientSecret: process.env.HACKCLUB_CLIENT_SECRET || '',
	authScope: process.env.HACKCLUB_AUTH_SCOPE || 'openid email name profile verification_status slack_id',
	airtableApiKey: process.env.AIRTABLE_API_KEY || '',
	airtableBaseId: process.env.AIRTABLE_BASE_ID || '',
	airtableListingsTable: process.env.AIRTABLE_LISTINGS_TABLE || 'Listings',
	airtableUsersTable: process.env.AIRTABLE_USERS_TABLE || 'Hack Club Users',
	airtableSubmissionsTable: process.env.AIRTABLE_SUBMISSIONS_TABLE || 'Submissions',
	sessionSecret: process.env.SESSION_SECRET || 'fixhc-dev-secret',
	sessionCookieName: process.env.SESSION_COOKIE_NAME || 'fixhc_session',
	oauthStateCookieName: process.env.OAUTH_STATE_COOKIE_NAME || 'fixhc_oauth_state',
};
