<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { addMonths, daysRemainingInMonth, type EnvelopeKey, monthLabel } from '$lib/domain';
	import { modals } from '$lib/modals.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Money from '$lib/ui/Money.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const monthDisplay = $derived(monthLabel(data.ym));
	const daysLeft = $derived(daysRemainingInMonth(new Date(), data.ym));
	const remaining = $derived(data.summary.income - data.summary.totalSpent);
	const dailyAvailable = $derived(daysLeft > 0 ? Math.round(remaining / daysLeft) : 0);

	let activeEnvKey = $state<EnvelopeKey>('necessities');
	let addingForEnvelope = $state<string | null>(null);
	let newCategoryLabel = $state('');

	function gotoMonth(delta: number) {
		const next = addMonths(data.ym, delta);
		const param = `${next.year}-${String(next.month + 1).padStart(2, '0')}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/')}?m=${param}`, { invalidateAll: true });
	}

	const envelopeNickname: Record<EnvelopeKey, string> = {
		necessities: 'Vie courante',
		wants: 'Plaisirs',
		investments: 'Avenir'
	};

	function categoriesFor(envelopeId: string) {
		return data.categories
			.filter((c) => c.envelopeId === envelopeId)
			.sort((a, b) => a.position - b.position);
	}

	function categoryAmount(categoryId: string): number {
		return data.summary.byCategory[categoryId] ?? 0;
	}

	function activeEnvelope() {
		return data.envelopes.find((e) => e.key === activeEnvKey) ?? data.envelopes[0]!;
	}

	function envelopeBudgetCents(key: EnvelopeKey): number {
		return data.summary.byEnvelope[key].budget;
	}
</script>

<div class="topbar">
	<div>
		<h1>Bonjour {data.user?.name ?? ''}</h1>
		<div class="topbar-sub">Aperçu de tes finances pour {monthDisplay}</div>
	</div>
	<div class="topbar-actions">
		<div class="month-switcher">
			<button type="button" onclick={() => gotoMonth(-1)} aria-label="Mois précédent">
				<Icon name="chevron-left" size={14} />
			</button>
			<span class="month-label">{monthDisplay}</span>
			<button type="button" onclick={() => gotoMonth(1)} aria-label="Mois suivant">
				<Icon name="chevron-right" size={14} />
			</button>
		</div>
		<button type="button" class="btn btn-primary" onclick={() => modals.openAddTx('expense')}>
			<Icon name="plus" size={14} /> Ajouter une transaction
		</button>
	</div>
</div>

<div class="hero-grid">
	<div class="hero-card primary">
		<div class="label">Reste à allouer ce mois-ci</div>
		<div class="value num"><Money cents={remaining} /></div>
		<div class="delta" style="color: oklch(0.75 0.01 80);">
			sur <Money cents={data.summary.income} /> de revenus
		</div>
	</div>
	<div class="hero-card">
		<div class="label">Revenus</div>
		<div class="value num"><Money cents={data.summary.income} /></div>
		<div class="delta">{data.summary.income > 0 ? 'Salaire + autres' : 'Aucun ce mois-ci'}</div>
	</div>
	<div class="hero-card">
		<div class="label">Dépensé</div>
		<div class="value num"><Money cents={data.summary.totalSpent} /></div>
		<div class="delta">
			{data.summary.income > 0
				? `${Math.round((data.summary.totalSpent / data.summary.income) * 100)}% des revenus`
				: '—'}
		</div>
	</div>
	<div class="hero-card">
		<div class="label">Jours restants</div>
		<div class="value num">{daysLeft}</div>
		<div class="delta">
			{#if daysLeft > 0}<Money cents={dailyAvailable} compact />/jour disponible{:else}Mois clos{/if}
		</div>
	</div>
</div>

<div class="section-title" style="margin-top: 8px;">
	Enveloppes
	<span class="section-title-meta"
		>— Méthode {data.envelopes.find((e) => e.key === 'necessities')?.ratio ??
			50}/{data.envelopes.find((e) => e.key === 'wants')?.ratio ?? 30}/{data.envelopes.find(
			(e) => e.key === 'investments'
		)?.ratio ?? 20}</span
	>
</div>
<div class="envelopes-row">
	{#each data.envelopes as env (env.id)}
		{@const stats = data.summary.byEnvelope[env.key]}
		{@const pct = stats.budget > 0 ? Math.min(100, (stats.spent / stats.budget) * 100) : 0}
		{@const over = stats.remaining < 0}
		<button type="button" class="envelope env-{env.key}" onclick={() => (activeEnvKey = env.key)}>
			<div class="envelope-corner"></div>
			<div class="envelope-head">
				<span class="envelope-tag">
					<span class="envelope-tag-dot"></span>
					{env.label}
				</span>
				<span class="envelope-pct">{env.ratio}%</span>
			</div>
			<div class="envelope-name">{envelopeNickname[env.key]}</div>
			<div class="envelope-spent-row">
				<span class="envelope-spent num"><Money cents={stats.spent} /></span>
				<span class="envelope-budget num">/ <Money cents={stats.budget} /></span>
			</div>
			<div class="envelope-bar" class:over>
				<div class="envelope-bar-fill" style="width: {pct}%;"></div>
			</div>
			<div class="envelope-foot">
				<span>{over ? 'Dépassement' : 'Reste'}</span>
				<span class="envelope-remaining num" class:over>
					<Money cents={Math.abs(stats.remaining)} />
				</span>
			</div>
		</button>
	{/each}
</div>

<div class="categories-detail">
	<div class="card-h" style="margin-bottom: 18px;">
		<div class="categories-tabs">
			{#each data.envelopes as env (env.id)}
				{@const count = categoriesFor(env.id).filter((c) => !c.isVirtual).length}
				<button
					type="button"
					class="categories-tab env-{env.key}"
					class:active={activeEnvKey === env.key}
					onclick={() => (activeEnvKey = env.key)}
				>
					<span class="categories-tab-dot" style="background: var(--env);"></span>
					{env.label}
					<span style="color: var(--text-subtle); font-weight: 400; margin-left: 4px;">
						{count}
					</span>
				</button>
			{/each}
		</div>
	</div>

	{#key activeEnvKey}
		{@const env = activeEnvelope()}
		{@const cats = categoriesFor(env.id)}
		{@const budget = envelopeBudgetCents(env.key)}
		{@const totals = cats.map((c) => categoryAmount(c.id))}
		{@const max = Math.max(...totals, budget * 0.4, 1)}
		<div class="cat-grid env-{env.key}">
			{#each cats as c (c.id)}
				{@const amount = categoryAmount(c.id)}
				{@const pct = max > 0 ? (amount / max) * 100 : 0}
				<div class="cat-tile">
					{#if !c.isVirtual}
						<form
							method="POST"
							action="?/removeCategory"
							use:enhance={({ cancel }) => {
								if (
									!confirm(
										`Supprimer la catégorie « ${c.label} » ?\nLes transactions concernées seront reclassées dans « Non catégorisé ».`
									)
								) {
									cancel();
								}
							}}
						>
							<input type="hidden" name="categoryId" value={c.id} />
							<button class="cat-tile-delete" type="submit" title="Supprimer">
								<Icon name="x" size={12} />
							</button>
						</form>
					{/if}
					<div class="cat-tile-head">
						<span class="cat-tile-name">{c.label}</span>
					</div>
					<div class="cat-tile-amount num"><Money cents={amount} /></div>
					<div class="cat-tile-bar">
						<div class="cat-tile-bar-fill" style="width: {pct}%;"></div>
					</div>
					<div class="cat-tile-meta">
						{budget > 0 ? Math.round((amount / budget) * 100) : 0}% de l'enveloppe
					</div>
				</div>
			{/each}

			{#if addingForEnvelope === env.id}
				<div class="cat-tile">
					<form
						method="POST"
						action="?/addCategory"
						use:enhance={() =>
							({ update }) => {
								addingForEnvelope = null;
								newCategoryLabel = '';
								return update();
							}}
					>
						<input type="hidden" name="envelopeId" value={env.id} />
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="cat-add-input"
							name="label"
							bind:value={newCategoryLabel}
							placeholder="Nom de la catégorie"
							autofocus
							onblur={(e) => {
								if (newCategoryLabel.trim())
									(e.currentTarget.form as HTMLFormElement).requestSubmit();
								else {
									addingForEnvelope = null;
									newCategoryLabel = '';
								}
							}}
							onkeydown={(e) => {
								if (e.key === 'Escape') {
									addingForEnvelope = null;
									newCategoryLabel = '';
								}
							}}
						/>
					</form>
				</div>
			{:else}
				<button class="cat-tile add" type="button" onclick={() => (addingForEnvelope = env.id)}>
					<Icon name="plus" size={14} /> Ajouter une catégorie
				</button>
			{/if}
		</div>
	{/key}
</div>
