<script lang="ts">
	import { resolve } from '$app/paths';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<header
	style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;"
>
	<strong>Budget</strong>
	<div style="display: flex; gap: 12px; align-items: center; font-size: 14px;">
		<span>{data.user?.name ?? data.user?.email}</span>
		<a href={resolve('/logout')}>Se déconnecter</a>
	</div>
</header>

<main style="padding: 32px 24px;">
	<h1 style="margin: 0 0 8px;">Bonjour {data.user?.name ?? ''}</h1>
	<p style="color: #6b7280;">
		Le tableau de bord arrive en section 6 du TODO. Pour l'instant, tu es connecté(e).
	</p>
</main>
