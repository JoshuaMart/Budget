import { createAuthClient } from 'better-auth/svelte';

// baseURL is inferred from window.location.origin in the browser.
export const authClient = createAuthClient();
