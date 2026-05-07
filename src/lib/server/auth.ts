import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from './db/client';
import { accountAuth, session, user, verification } from './db/schema';
import { initUserData } from './initUserData';

const baseURL = process.env.ORIGIN ?? 'http://localhost:5173';
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
	throw new Error('BETTER_AUTH_SECRET is required (see .env.example)');
}

// Default-enabled. Only the explicit string "false" disables signup;
// any other value (including an unset env var) leaves it on.
export const signupEnabled = process.env.ENABLE_SIGNUP !== 'false';

export const auth = betterAuth({
	baseURL,
	secret,
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: {
			user,
			session,
			// Our budget schema already uses `account` for bank accounts; map
			// better-auth's `account` table to our renamed `account_auth`.
			account: accountAuth,
			verification
		}
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 8,
		disableSignUp: !signupEnabled,
		// No email infra in V1; do not block login on unverified addresses.
		requireEmailVerification: false
	},
	databaseHooks: {
		user: {
			create: {
				after: async (createdUser) => {
					initUserData(createdUser.id);
				}
			}
		}
	},
	rateLimit: {
		enabled: true,
		storage: 'memory',
		// Default: 60 req per 10s on /api/auth/*. Tighten the auth-sensitive endpoints.
		customRules: {
			'/sign-in/email': { window: 600, max: 5 },
			'/sign-up/email': { window: 600, max: 5 }
		}
	},
	advanced: {
		defaultCookieAttributes: {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production'
		}
	}
});
