<script lang="ts">
	import '../app.css';

	import favicon from '$lib/assets/favicon.svg';
	import { modals } from '$lib/modals.svelte';
	import AccountsModal from '$lib/ui/AccountsModal.svelte';
	import AddTxModal from '$lib/ui/AddTxModal.svelte';
	import RatiosModal from '$lib/ui/RatiosModal.svelte';
	import Sidebar from '$lib/ui/Sidebar.svelte';

	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const currentRatios = $derived({
		necessities: data.envelopes.find((e) => e.key === 'necessities')?.ratio ?? 50,
		wants: data.envelopes.find((e) => e.key === 'wants')?.ratio ?? 30,
		investments: data.envelopes.find((e) => e.key === 'investments')?.ratio ?? 20
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<div class="app">
		<Sidebar
			accounts={data.accounts}
			onEditAccounts={() => modals.openAccounts()}
			onEditRatios={() => modals.openRatios()}
		/>
		<main class="main">
			{@render children()}
		</main>
	</div>

	{#if modals.addTx.open}
		<AddTxModal
			envelopes={data.envelopes}
			categories={data.categories}
			accounts={data.accounts}
			defaultMode={modals.addTx.defaultMode}
		/>
	{/if}

	{#if modals.accounts.open}
		<AccountsModal initialAccounts={data.accounts} />
	{/if}

	{#if modals.ratios.open}
		<RatiosModal initial={currentRatios} />
	{/if}
{:else}
	{@render children()}
{/if}
