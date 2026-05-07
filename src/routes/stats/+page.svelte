<script lang="ts">
	import { type EnvelopeKey, monthLabel } from '$lib/domain';
	import Donut from '$lib/ui/Donut.svelte';
	import Money from '$lib/ui/Money.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ENV_COLOR: Record<EnvelopeKey, string> = {
		necessities: 'var(--nec)',
		wants: 'var(--want)',
		investments: 'var(--inv)'
	};
	const ENV_LABEL: Record<EnvelopeKey, string> = {
		necessities: 'Nécessités',
		wants: 'Envies',
		investments: 'Investissements'
	};
	const SHORT_MONTH_FR = [
		'Jan',
		'Fév',
		'Mar',
		'Avr',
		'Mai',
		'Juin',
		'Juil',
		'Août',
		'Sep',
		'Oct',
		'Nov',
		'Déc'
	];

	const totalSpent = $derived(data.summary.totalSpent);
	const maxMonthlyTotal = $derived(
		Math.max(1, ...data.trend.map((m) => m.necessities + m.wants + m.investments))
	);
	const monthsRangeLabel = $derived(
		data.trend.length
			? `${SHORT_MONTH_FR[data.trend[0]!.month]} → ${SHORT_MONTH_FR[data.trend.at(-1)!.month]}`
			: ''
	);

	const donutSlices = $derived(
		(['necessities', 'wants', 'investments'] as const).map((key) => ({
			envelopeKey: key,
			label: ENV_LABEL[key],
			spentCents: data.summary.byEnvelope[key].spent,
			budgetCents: data.summary.byEnvelope[key].budget,
			color: ENV_COLOR[key]
		}))
	);

	const maxTopCat = $derived(data.top[0]?.spentCents || 1);
</script>

<div class="topbar">
	<div>
		<h1>Statistiques</h1>
		<div class="topbar-sub">Vue d'ensemble sur 6 mois</div>
	</div>
</div>

<div class="hero-grid" style="grid-template-columns: repeat(4, 1fr);">
	<div class="hero-card">
		<div class="label">Dépensé en {(SHORT_MONTH_FR[data.ym.month] ?? '').toLowerCase()}</div>
		<div class="value num"><Money cents={totalSpent} /></div>
		<div class="delta">ce mois-ci</div>
	</div>
	<div class="hero-card">
		<div class="label">Moyenne mensuelle</div>
		<div class="value num">
			<Money
				cents={Math.round(
					data.trend.reduce((s, m) => s + m.necessities + m.wants + m.investments, 0) /
						Math.max(1, data.trend.length)
				)}
				compact
			/>
		</div>
		<div class="delta">sur {data.trend.length} mois</div>
	</div>
	<div class="hero-card">
		<div class="label">Investissements 6 mois</div>
		<div class="value num">
			<Money cents={data.trend.reduce((s, m) => s + m.investments, 0)} compact />
		</div>
		<div class="delta">cumulés</div>
	</div>
	<div class="hero-card">
		<div class="label">Conformité 50/30/20</div>
		<div class="value num">{data.compliance}%</div>
		<div class="delta">écart aux ratios cibles</div>
	</div>
</div>

<div class="stats-grid" style="margin-top: 12px;">
	<div class="card">
		<div class="card-h">
			<div class="card-title">Évolution mensuelle</div>
			<div class="card-title num" style="color: var(--text-subtle);">{monthsRangeLabel}</div>
		</div>
		<div class="bars-chart">
			{#each data.trend as m (m.year + '-' + m.month)}
				{@const total = m.necessities + m.wants + m.investments}
				{@const necW = (m.necessities / maxMonthlyTotal) * 100}
				{@const wantW = (m.wants / maxMonthlyTotal) * 100}
				{@const invW = (m.investments / maxMonthlyTotal) * 100}
				<div class="bars-row">
					<span class="bars-month">{SHORT_MONTH_FR[m.month]}</span>
					<div class="bars-stack">
						<span style="width: {necW}%; background: var(--nec);"></span>
						<span style="width: {wantW}%; background: var(--want);"></span>
						<span style="width: {invW}%; background: var(--inv);"></span>
					</div>
					<span class="bars-total"><Money cents={total} compact /></span>
				</div>
			{/each}
		</div>
		<div
			style="display: flex; gap: 16px; margin-top: 14px; font-size: 12px; color: var(--text-muted);"
		>
			<span style="display: inline-flex; align-items: center; gap: 6px;">
				<span style="width: 8px; height: 8px; border-radius: 2px; background: var(--nec);"></span>
				Nécessités
			</span>
			<span style="display: inline-flex; align-items: center; gap: 6px;">
				<span style="width: 8px; height: 8px; border-radius: 2px; background: var(--want);"></span>
				Envies
			</span>
			<span style="display: inline-flex; align-items: center; gap: 6px;">
				<span style="width: 8px; height: 8px; border-radius: 2px; background: var(--inv);"></span>
				Investissements
			</span>
		</div>
	</div>

	<div class="card">
		<div class="card-h">
			<div class="card-title">Répartition de {monthLabel(data.ym).toLowerCase()}</div>
		</div>
		<Donut slices={donutSlices} totalSpentCents={totalSpent} />
	</div>
</div>

<div class="card" style="margin-top: 12px;">
	<div class="card-h">
		<div class="card-title">Top catégories ce mois-ci</div>
		<div class="card-title num" style="color: var(--text-subtle);">
			{data.top.length} catégorie{data.top.length > 1 ? 's' : ''}
		</div>
	</div>
	<div class="top-cats">
		{#each data.top as c (c.categoryId)}
			{@const pct = (c.spentCents / maxTopCat) * 100}
			<div class="top-cat env-{c.envelopeKey}">
				<div class="top-cat-icon" style="background: var(--env-soft); color: var(--env);">
					{c.label.charAt(0)}
				</div>
				<div class="top-cat-info">
					<div style="display: flex; justify-content: space-between;">
						<span class="top-cat-name">{c.label}</span>
						<span style="font-size: 11px; color: var(--text-muted);"
							>{ENV_LABEL[c.envelopeKey]}</span
						>
					</div>
					<div class="top-cat-bar">
						<div class="top-cat-bar-fill" style="width: {pct}%; background: var(--env);"></div>
					</div>
				</div>
				<div class="top-cat-amount num"><Money cents={c.spentCents} /></div>
			</div>
		{/each}
		{#if data.top.length === 0}
			<div style="padding: 40px; text-align: center; color: var(--text-muted);">
				Aucune dépense ce mois-ci.
			</div>
		{/if}
	</div>
</div>
