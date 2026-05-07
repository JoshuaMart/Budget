<script lang="ts">
	import '../app.css';

	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/ui/Sidebar.svelte';

	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<div class="app">
		<Sidebar accounts={data.accounts} />
		<main class="main">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
