<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { dayLabel, type EnvelopeKey } from '$lib/domain';
	import { modals } from '$lib/modals.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Money from '$lib/ui/Money.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let search = $state(data.search);

	type Tx = (typeof data.transactions)[number];
	type Env = (typeof data.envelopes)[number];
	type Cat = (typeof data.categories)[number];
	type Acc = (typeof data.accounts)[number];

	const envById = $derived(
		Object.fromEntries(data.envelopes.map((e) => [e.id, e])) as Record<string, Env>
	);
	const catById = $derived(
		Object.fromEntries(data.categories.map((c) => [c.id, c])) as Record<string, Cat>
	);
	const accById = $derived(
		Object.fromEntries(data.accounts.map((a) => [a.id, a])) as Record<string, Acc>
	);

	const byDay = $derived.by(() => {
		const buckets: Record<string, Tx[]> = {};
		for (const t of data.transactions) {
			(buckets[t.date] ??= []).push(t);
		}
		return Object.entries(buckets).sort(([a], [b]) => b.localeCompare(a));
	});

	function buildQuery(parts: Record<string, string | null>): string {
		const segs: string[] = [];
		for (const [k, v] of Object.entries(parts)) {
			if (v) segs.push(`${k}=${encodeURIComponent(v)}`);
		}
		return segs.length ? `?${segs.join('&')}` : '';
	}

	function applyFilters() {
		const qs = buildQuery({ q: search, env: data.envFilter });
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/transactions')}${qs}`, { invalidateAll: true });
	}

	function setEnvFilter(env: EnvelopeKey | null) {
		const envelopeId = env ? (data.envelopes.find((e) => e.key === env)?.id ?? null) : null;
		const qs = buildQuery({ q: search, env: envelopeId });
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/transactions')}${qs}`, { invalidateAll: true });
	}

	const activeEnvKey = $derived.by<EnvelopeKey | null>(() => {
		if (!data.envFilter) return null;
		return data.envelopes.find((e) => e.id === data.envFilter)?.key ?? null;
	});

	function openEdit(t: Tx) {
		modals.openEditTx({
			id: t.id,
			kind: t.kind,
			amountCents: t.amountCents,
			merchant: t.merchant,
			date: t.date,
			accountId: t.accountId,
			toAccountId: t.toAccountId,
			envelopeId: t.envelopeId,
			categoryId: t.categoryId,
			incomeCategory: t.incomeCategory
		});
	}
</script>

<div class="topbar">
	<div>
		<h1>Transactions</h1>
		<div class="topbar-sub">
			{data.transactions.length} mouvement{data.transactions.length > 1 ? 's' : ''} · classés automatiquement
		</div>
	</div>
	<div class="topbar-actions">
		<button type="button" class="btn btn-primary" onclick={() => modals.openAddTx('expense')}>
			<Icon name="plus" size={14} /> Ajouter
		</button>
	</div>
</div>

<div class="tx-toolbar">
	<input
		class="tx-search"
		placeholder="Rechercher un commerçant…"
		bind:value={search}
		onkeydown={(e) => {
			if (e.key === 'Enter') applyFilters();
		}}
		onblur={applyFilters}
	/>
	<button
		type="button"
		class="tx-filter-pill"
		class:active={!activeEnvKey}
		onclick={() => setEnvFilter(null)}
	>
		Tout
	</button>
	{#each data.envelopes as env (env.id)}
		<button
			type="button"
			class="tx-filter-pill env-{env.key}"
			class:active={activeEnvKey === env.key}
			onclick={() => setEnvFilter(activeEnvKey === env.key ? null : env.key)}
			style={activeEnvKey === env.key ? '' : 'color: var(--env);'}
		>
			<span
				style="width: 6px; height: 6px; border-radius: 50%; background: {activeEnvKey === env.key
					? 'currentColor'
					: 'var(--env)'};"
			></span>
			{env.label}
		</button>
	{/each}
</div>

<div class="tx-list">
	{#each byDay as [day, txs] (day)}
		{@const dayTotal = txs.reduce((s, t) => s + t.amountCents, 0)}
		<div class="tx-day-h">
			<span>{dayLabel(day)}</span>
			<span class="day-total"><Money cents={dayTotal} signed /></span>
		</div>
		{#each txs as t (t.id)}
			{@const env = t.envelopeId ? envById[t.envelopeId] : null}
			{@const cat = t.categoryId ? catById[t.categoryId] : null}
			{@const acc = accById[t.accountId]}
			{@const toAcc = t.toAccountId ? accById[t.toAccountId] : null}
			{@const isTransfer = t.kind === 'transfer'}
			{@const isIncome = t.kind === 'income'}
			<div
				class="tx-row env-{env?.key ?? 'necessities'}"
				role="button"
				tabindex="0"
				title="Modifier la transaction"
				onclick={() => openEdit(t)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						openEdit(t);
					}
				}}
			>
				<div class="tx-icon">{isTransfer ? '↗' : t.merchant.charAt(0).toUpperCase()}</div>
				<div>
					<div class="tx-merchant">
						{t.merchant}
						{#if t.recurringId}
							<span
								style="margin-left: 8px; font-size: 10px; font-weight: 500; padding: 2px 6px; background: var(--bg-sunk); color: var(--text-muted); border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em;"
							>
								Récurrent
							</span>
						{/if}
					</div>
					<div class="tx-cat">
						{#if isTransfer && toAcc}
							<span class="tx-transfer-arrow">{acc?.label} → {toAcc.label}</span>
						{:else if cat}
							{cat.label}
						{:else if isIncome}
							Revenu{t.incomeCategory ? ` · ${t.incomeCategory}` : ''}
						{:else}
							—
						{/if}
					</div>
				</div>
				<div>
					{#if env}
						<span class="tx-envelope-tag">
							<span class="tx-envelope-tag-dot"></span>
							{env.label}
						</span>
					{:else}
						<span
							class="tx-envelope-tag"
							style="background: oklch(0.95 0.04 155); color: oklch(0.45 0.10 155);"
						>
							<span class="tx-envelope-tag-dot" style="background: oklch(0.45 0.10 155);"></span>
							Revenu
						</span>
					{/if}
				</div>
				<div class="tx-account">
					{isTransfer && toAcc ? `${acc?.label} → ${toAcc.label}` : acc?.label}
				</div>
				<div class="tx-amount" class:income={isIncome}>
					<Money cents={t.amountCents} signed />
				</div>
			</div>
		{/each}
	{/each}
	{#if data.transactions.length === 0}
		<div style="padding: 60px; text-align: center; color: var(--text-muted);">
			Aucune transaction. Ajoute-en une pour démarrer ton suivi.
		</div>
	{/if}
</div>
