<script lang="ts">
	import { enhance } from '$app/forms';
	import { dayLabel, type EnvelopeKey } from '$lib/domain';
	import { modals } from '$lib/modals.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Money from '$lib/ui/Money.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const accLabel = (id: string | null | undefined) =>
		id ? (data.accounts.find((a) => a.id === id)?.label ?? '—') : '—';

	type Env = (typeof data.envelopes)[number];
	type Cat = (typeof data.categories)[number];

	const envById = $derived(
		Object.fromEntries(data.envelopes.map((e) => [e.id, e])) as Record<string, Env>
	);
	const catById = $derived(
		Object.fromEntries(data.categories.map((c) => [c.id, c])) as Record<string, Cat>
	);

	const active = $derived(data.recurrings.filter((r) => r.active));
	const totalIncome = $derived(
		active.filter((r) => r.kind === 'income').reduce((s, r) => s + r.amountCents, 0)
	);
	const totalExpenses = $derived(
		active.filter((r) => r.kind !== 'income').reduce((s, r) => s + r.amountCents, 0)
	);
	const byEnv = $derived.by(() => {
		const m: Record<EnvelopeKey, number> = { necessities: 0, wants: 0, investments: 0 };
		for (const r of active) {
			if (r.kind === 'income' || !r.envelopeId) continue;
			const env = envById[r.envelopeId];
			if (env) m[env.key] += r.amountCents;
		}
		return m;
	});

	const sorted = $derived([...data.recurrings].sort((a, b) => b.amountCents - a.amountCents));

	function freqLabel(r: { frequency: string; dayOfMonth: number | null }): string {
		if (r.frequency === 'monthly') return `Mensuel · le ${r.dayOfMonth ?? '—'}`;
		if (r.frequency === 'weekly') return 'Hebdomadaire';
		if (r.frequency === 'yearly') return 'Annuel';
		return r.frequency;
	}
</script>

<div class="topbar">
	<div>
		<h1>Paiements récurrents</h1>
		<div class="topbar-sub">
			{active.length} actif{active.length > 1 ? 's' : ''} · charges fixes mensuelles
			<Money cents={totalExpenses} />
		</div>
	</div>
	<div class="topbar-actions">
		<button
			type="button"
			class="btn btn-primary"
			onclick={() => modals.openAddRecurring('expense')}
		>
			<Icon name="plus" size={14} /> Nouveau récurrent
		</button>
	</div>
</div>

<div class="recurring-grid">
	<div class="rec-summary">
		<div class="label">Engagements mensuels par enveloppe</div>
		{#each data.envelopes as env (env.id)}
			<div class="rec-summary-row env-{env.key}">
				<span class="name">
					<span class="dot" style="background: var(--env);"></span>
					{env.label}
				</span>
				<span class="amount"><Money cents={byEnv[env.key]} /></span>
			</div>
		{/each}
		<div
			class="rec-summary-row"
			style="border-top: 2px solid var(--border); margin-top: 6px; padding-top: 12px;"
		>
			<span class="name" style="font-weight: 600;">Total dépenses fixes</span>
			<span class="amount" style="font-size: 16px;"><Money cents={totalExpenses} /></span>
		</div>
	</div>

	<div class="rec-summary">
		<div class="label">Solde net mensuel</div>
		<div
			style="font-family: var(--font-mono); font-size: 32px; font-weight: 500; letter-spacing: -0.025em; margin-top: 4px;"
		>
			<Money cents={totalIncome - totalExpenses} signed />
		</div>
		<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
			après revenus récurrents et charges fixes
		</div>
		<div style="margin-top: 18px; display: flex; gap: 14px;">
			<div style="flex: 1; padding: 12px; background: oklch(0.95 0.04 155); border-radius: 10px;">
				<div
					style="font-size: 11px; color: oklch(0.40 0.10 155); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;"
				>
					Revenus
				</div>
				<div
					class="num"
					style="font-size: 16px; font-weight: 500; margin-top: 4px; color: oklch(0.40 0.10 155);"
				>
					<Money cents={totalIncome} />
				</div>
			</div>
			<div style="flex: 1; padding: 12px; background: oklch(0.95 0.03 30); border-radius: 10px;">
				<div
					style="font-size: 11px; color: oklch(0.40 0.10 30); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;"
				>
					Charges
				</div>
				<div
					class="num"
					style="font-size: 16px; font-weight: 500; margin-top: 4px; color: oklch(0.40 0.10 30);"
				>
					<Money cents={totalExpenses} />
				</div>
			</div>
		</div>
	</div>
</div>

<div class="rec-list">
	{#each sorted as r (r.id)}
		{@const env = r.envelopeId ? envById[r.envelopeId] : null}
		{@const cat = r.categoryId ? catById[r.categoryId] : null}
		{@const isIncome = r.kind === 'income'}
		{@const isTransfer = r.kind === 'transfer'}
		<div class="rec-row {env ? `env-${env.key}` : ''}" class:inactive={!r.active}>
			<div class="rec-icon" class:income={isIncome}>{r.merchant.charAt(0)}</div>
			<div>
				<div class="rec-merchant">{r.merchant}</div>
				<div class="rec-meta">
					{#if isIncome}
						Revenu{r.incomeCategory ? ` · ${r.incomeCategory}` : ''}
					{:else if isTransfer}
						Transfert → {accLabel(r.toAccountId)}
					{:else if env}
						{env.label}{cat ? ` · ${cat.label}` : ''}
					{:else}
						—
					{/if}
				</div>
			</div>
			<div class="rec-frequency">
				<div class="rec-frequency-icon"><Icon name="chart" size={12} /></div>
				{freqLabel(r)}
			</div>
			<div class="rec-next">Prochaine : {dayLabel(r.nextDate)}</div>
			<div class="rec-meta">{accLabel(r.accountId)}</div>
			<div class="rec-amount" class:income={isIncome}>
				<Money cents={isIncome ? r.amountCents : -r.amountCents} signed />
			</div>
			<div style="display: flex; gap: 4px; align-items: center; justify-content: flex-end;">
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={r.id} />
					<button
						type="submit"
						class="rec-toggle"
						class:on={r.active}
						title={r.active ? 'Désactiver' : 'Activer'}
						aria-label={r.active ? 'Désactiver' : 'Activer'}
					></button>
				</form>
			</div>
		</div>
	{/each}
	{#if sorted.length === 0}
		<div style="padding: 60px; text-align: center; color: var(--text-muted);">
			Aucun paiement récurrent. Ajoute-en un pour automatiser ton suivi.
		</div>
	{/if}
</div>
