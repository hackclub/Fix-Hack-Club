import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

import listingsHandler from './api/listings.js';
import submissionsHandler from './api/submissions.js';
import meHandler from './api/auth/me.js';
import startHandler from './api/auth/start.js';
import callbackHandler from './api/auth/callback.js';
import logoutHandler from './api/auth/logout.js';

// Bridge .env values into process.env. Vite only exposes prefixed vars to the
// client via import.meta.env, and Prisma Client does not read .env at runtime,
// so the delegated API handlers below need the values on process.env directly.
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const loadedEnv = loadEnv(mode, process.cwd(), '');
for (const [key, value] of Object.entries(loadedEnv)) {
	if (process.env[key] === undefined) {
		process.env[key] = value;
	}
}

// During dev, reuse the exact same serverless handlers that run on Vercel so
// local behavior matches production.
const apiRoutes = {
	'/api/listings': listingsHandler,
	'/api/submissions': submissionsHandler,
	'/api/auth/me': meHandler,
	'/api/auth/start': startHandler,
	'/api/auth/callback': callbackHandler,
	'/api/auth/logout': logoutHandler,
};

export default defineConfig({
	server: {
		host: true,
	},
	build: {
		rollupOptions: {
			input: {
				main: fileURLToPath(new URL('./index.html', import.meta.url)),
				dashboard: fileURLToPath(new URL('./dashboard.html', import.meta.url)),
			},
		},
	},
	plugins: [
		{
			name: 'fixhc-api-middleware',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					const pathname = new URL(req.url || '/', 'http://localhost').pathname;
					const handler = apiRoutes[pathname];

					if (!handler) {
						next();
						return;
					}

					Promise.resolve(handler(req, res)).catch((error) => {
						if (res.writableEnded) {
							return;
						}

						res.statusCode = 500;
						res.setHeader('Content-Type', 'application/json; charset=utf-8');
						res.end(JSON.stringify({ error: 'Internal error', message: error.message }));
					});
				});
			},
		},
	],
});
