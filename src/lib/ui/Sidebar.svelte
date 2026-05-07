<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { AccountWithBalance } from '$lib/server/services/accounts.service';

	import Icon from './Icon.svelte';
	import Money from './Money.svelte';

	let {
		accounts,
		onEditAccounts
	}: {
		accounts: AccountWithBalance[];
		onEditAccounts?: () => void;
	} = $props();

	const navItems = [
		{ href: resolve('/'), icon: 'home', label: 'Tableau de bord' },
		{ href: resolve('/transactions'), icon: 'list', label: 'Transactions' },
		{ href: resolve('/recurring'), icon: 'wallet', label: 'Récurrents' },
		{ href: resolve('/stats'), icon: 'chart', label: 'Statistiques' }
	] as const;

	let totalBalance = $derived(accounts.reduce((sum, a) => sum + a.currentBalanceCents, 0));

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === '/') return path === '/';
		return path === href || path.startsWith(`${href}/`);
	}
</script>

<aside class="sidebar">
	<div class="brand">
		<div class="brand-mark">B</div>
		<div class="brand-name">Budget</div>
	</div>

	<nav class="nav">
		{#each navItems as item (item.href)}
			<a class="nav-item" class:active={isActive(item.href)} href={item.href}>
				<Icon name={item.icon} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div>
		<div class="sidebar-section-label">
			<span>Comptes</span>
			{#if onEditAccounts}
				<button
					type="button"
					class="sidebar-add-btn"
					onclick={onEditAccounts}
					title="Modifier les comptes"
				>
					<Icon name="edit" size={12} />
				</button>
			{/if}
		</div>
		{#each accounts as a (a.id)}
			<div class="account-card" class:savings={a.type === 'savings'}>
				<span class="account-card-label">
					<span class="account-dot"></span>
					{a.label}
				</span>
				<span class="account-card-balance num">
					<Money cents={a.currentBalanceCents} />
				</span>
			</div>
		{/each}
		<div class="account-card" style="background: var(--bg-sunk); box-shadow: none;">
			<span class="account-card-label" style="color: var(--text-subtle);">Total tous comptes</span>
			<span class="account-card-balance num" style="font-size: 15px;">
				<Money cents={totalBalance} />
			</span>
		</div>
	</div>

	<div class="sidebar-foot">
		<a href={resolve('/logout')} class="nav-item logout">Se déconnecter</a>
	</div>
</aside>

<style>
	.sidebar-foot {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.logout {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>
