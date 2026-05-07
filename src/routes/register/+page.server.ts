import { redirect } from '@sveltejs/kit';

import { signupEnabled } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	if (!signupEnabled) {
		// Signup is closed — bounce back to /login. The button to /register is
		// already hidden client-side, but a direct hit (bookmark, link sharing)
		// lands here.
		throw redirect(303, '/login');
	}
};
