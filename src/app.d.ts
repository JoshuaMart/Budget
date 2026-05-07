// See https://svelte.dev/docs/kit/types#app.d.ts
import type { auth } from '$lib/server/auth';

type Auth = typeof auth;
type Session = Awaited<ReturnType<Auth['api']['getSession']>>;
type SessionUser = NonNullable<Session>['user'];
type SessionData = NonNullable<Session>['session'];

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: SessionUser | null;
			session: SessionData | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
