<script lang="ts">
	import { onMount } from 'svelte';

	import { authClient } from '#lib/auth-client.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	onMount(async () => {
		await authClient.signOut();
		await goto(resolve('/login'), { invalidateAll: true });
	});
</script>

<p style="padding: 24px; text-align: center; color: #6b7280;">Déconnexion…</p>
