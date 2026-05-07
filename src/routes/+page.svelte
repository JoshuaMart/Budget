<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="topbar">
	<div>
		<h1>Bonjour {data.user?.name ?? ''}</h1>
		<div class="topbar-sub">Le tableau de bord arrive en section 6 du TODO.</div>
	</div>
</div>
