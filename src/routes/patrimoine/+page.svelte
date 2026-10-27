<script lang="ts">
	import {
		allocationByClass,
		allocationByWallet,
		ASSET_CLASSES,
		type AssetClass,
		formatCents,
		holdingCost,
		holdingValue,
		performance
	} from '#lib/domain/index.ts';
	import HoldingModal, { type HoldingDraft } from '#lib/ui/HoldingModal.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Money from '#lib/ui/Money.svelte';
	import { enhance } from '$app/forms';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const CLASS_LABEL: Record<AssetClass, string> = {
		etf: 'ETF',
		stock: 'Actions',
		crypto: 'Crypto'
	};
	const CLASS_COLOR: Record<AssetClass, string> = {
		etf: 'var(--inv)',
		stock: 'var(--want)',
		crypto: 'var(--nec)'
	};

	const cashCents = $derived(data.accounts.reduce((s, a) => s + a.currentBalanceCents, 0));
	const perf = $derived(performance(data.holdings));
	const netWorth = $derived(cashCents + perf.valueCents);
	const byClass = $derived(allocationByClass(data.holdings));
	const byWallet = $derived(allocationByWallet(data.holdings));
	const wallets = $derived(byWallet.map((w) => w.wallet));

	const lastUpdate = $derived.by(() => {
		const ts = data.holdings
			.map((h) => (h.lastPriceAt ? new Date(h.lastPriceAt).getTime() : 0))
			.filter(Boolean);
		if (!ts.length) return null;
		return new Date(Math.min(...ts)).toLocaleString('fr-FR', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	const grouped = $derived(
		byWallet.map((w) => ({ ...w, holdings: data.holdings.filter((h) => h.wallet === w.wallet) }))
	);

	// History chart: total net worth per snapshot.
	const W = 600;
	const H = 160;
	const history = $derived(
		data.snapshots.map((s) => ({ date: s.date, total: s.cashCents + s.holdingsCents }))
	);
	const chart = $derived.by(() => {
		if (history.length < 2) return null;
		const totals = history.map((p) => p.total);
		const min = Math.min(...totals);
		const max = Math.max(...totals);
		const span = max - min || 1;
		const pts = history.map((p, i) => {
			const x = (i / (history.length - 1)) * W;
			const y = H - 8 - ((p.total - min) / span) * (H - 16);
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		});
		return {
			line: pts.join(' '),
			area: `0,${H} ${pts.join(' ')} ${W},${H}`,
			min,
			max,
			from: history[0]!.date,
			to: history.at(-1)!.date
		};
	});

	const shortDate = (iso: string) =>
		new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

	const fmtQty = (q: number) => q.toLocaleString('fr-FR', { maximumFractionDigits: 8 });
	const fmtPct = (p: number) =>
		`${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

	let modalOpen = $state(false);
	let editing = $state<HoldingDraft | undefined>();
	let refreshing = $state(false);

	function openAdd() {
		editing = undefined;
		modalOpen = true;
	}
	function openEdit(h: (typeof data.holdings)[number]) {
		editing = {
			id: h.id,
			assetClass: h.assetClass,
			wallet: h.wallet,
			symbol: h.symbol,
			label: h.label,
			quantity: h.quantity,
			avgCostCents: h.avgCostCents
		};
		modalOpen = true;
	}
</script>

<div class="topbar">
	<div>
		<h1>Patrimoine</h1>
		<div class="topbar-sub">
			{#if lastUpdate}Cours au {lastUpdate}{:else}Comptes bancaires et investissements{/if}
		</div>
	</div>
	<div class="topbar-actions">
		{#if data.holdings.length}
			<form
				method="POST"
				action="?/refresh"
				use:enhance={() => {
					refreshing = true;
					return async ({ update }) => {
						await update();
						refreshing = false;
					};
				}}
			>
				<button type="submit" class="btn btn-ghost" disabled={refreshing}>
					{refreshing ? 'Actualisation…' : 'Actualiser les cours'}
				</button>
			</form>
		{/if}
		<button type="button" class="btn btn-primary" onclick={openAdd}>
			<Icon name="plus" size={14} /> Ajouter une position
		</button>
	</div>
</div>

<div class="hero-grid">
	<div class="hero-card">
		<div class="label">Patrimoine net</div>
		<div class="value num"><Money cents={netWorth} compact /></div>
		<div class="delta">liquidités + investissements</div>
	</div>
	<div class="hero-card">
		<div class="label">Investissements</div>
		<div class="value num"><Money cents={perf.valueCents} compact /></div>
		<div class="delta">investi <Money cents={perf.costCents} compact /></div>
	</div>
	<div class="hero-card">
		<div class="label">Plus-value latente</div>
		<div class="value num" class:gain={perf.gainCents > 0} class:loss={perf.gainCents < 0}>
			<Money cents={perf.gainCents} signed compact />
		</div>
		<div class="delta">{fmtPct(perf.gainPct)}</div>
	</div>
	<div class="hero-card">
		<div class="label">Liquidités</div>
		<div class="value num"><Money cents={cashCents} compact /></div>
		<div class="delta">
			{data.accounts.length} compte{data.accounts.length > 1 ? 's' : ''} bancaire{data.accounts
				.length > 1
				? 's'
				: ''}
		</div>
	</div>
</div>

<div class="stats-grid" style="margin-top: 12px;">
	<div class="card">
		<div class="card-h">
			<div class="card-title">Évolution du patrimoine</div>
			{#if chart}
				<div class="card-title num" style="color: var(--text-subtle);">
					{shortDate(chart.from)} → {shortDate(chart.to)}
				</div>
			{/if}
		</div>
		{#if chart}
			<svg class="history" viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img">
				<title>Patrimoine net de {formatCents(chart.min)} à {formatCents(chart.max)}</title>
				<polygon points={chart.area} fill="var(--inv-soft)" />
				<polyline
					points={chart.line}
					fill="none"
					stroke="var(--inv)"
					stroke-width="2"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
			<div class="history-scale num">
				<span>min <Money cents={chart.min} compact /></span>
				<span>max <Money cents={chart.max} compact /></span>
			</div>
		{:else}
			<div class="empty">
				L'historique se construit automatiquement : un point est enregistré chaque jour à
				l'actualisation des cours.
			</div>
		{/if}
	</div>

	<div class="card">
		<div class="card-h">
			<div class="card-title">Répartition</div>
		</div>
		{#if perf.valueCents > 0}
			<div class="alloc-bar">
				{#each ASSET_CLASSES as c (c)}
					{#if byClass[c] > 0}
						<span
							style="width: {(byClass[c] / perf.valueCents) * 100}%; background: {CLASS_COLOR[c]};"
						></span>
					{/if}
				{/each}
			</div>
			<div class="alloc-legend">
				{#each ASSET_CLASSES as c (c)}
					<div class="alloc-row">
						<span class="alloc-name">
							<span class="dot" style="background: {CLASS_COLOR[c]};"></span>
							{CLASS_LABEL[c]}
						</span>
						<span class="num alloc-pct">{Math.round((byClass[c] / perf.valueCents) * 100)} %</span>
						<span class="num"><Money cents={byClass[c]} compact /></span>
					</div>
				{/each}
			</div>
			<div class="alloc-sep"></div>
			{#each byWallet as w (w.wallet)}
				<div class="alloc-row">
					<span class="alloc-name">{w.wallet}</span>
					<span class="num alloc-pct">{Math.round((w.valueCents / perf.valueCents) * 100)} %</span>
					<span class="num"><Money cents={w.valueCents} compact /></span>
				</div>
			{/each}
		{:else}
			<div class="empty">Aucune position pour l'instant.</div>
		{/if}
	</div>
</div>

{#each grouped as g (g.wallet)}
	<div class="section-title" style="margin-top: 22px;">
		{g.wallet}
		<span class="section-title-meta num"><Money cents={g.valueCents} /></span>
	</div>
	<div class="rec-list">
		{#each g.holdings as h (h.id)}
			{@const value = holdingValue(h)}
			{@const gain = value - holdingCost(h)}
			{@const cost = holdingCost(h)}
			<div
				class="pos-row"
				role="button"
				tabindex="0"
				title="Modifier la position"
				onclick={() => openEdit(h)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						openEdit(h);
					}
				}}
			>
				<div class="pos-icon" style="color: {CLASS_COLOR[h.assetClass]};">
					{h.label.charAt(0)}
				</div>
				<div class="pos-main">
					<div class="pos-label">{h.label}</div>
					<div class="pos-meta num">
						{h.symbol} · {CLASS_LABEL[h.assetClass]}
					</div>
				</div>
				<div class="pos-qty num">
					<div>{fmtQty(h.quantity)}</div>
					<div class="pos-meta">PRU <Money cents={h.avgCostCents} /></div>
				</div>
				<div class="pos-price num">
					{#if h.lastPriceCents !== null}
						<Money cents={h.lastPriceCents} />
					{:else}
						<span class="pos-meta">cours indisponible</span>
					{/if}
				</div>
				<div class="pos-value num">
					<div><Money cents={value} /></div>
					<div class="pos-gain" class:gain={gain > 0} class:loss={gain < 0}>
						<Money cents={gain} signed />
						{#if cost > 0}· {fmtPct((gain / cost) * 100)}{/if}
					</div>
				</div>
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`Supprimer « ${h.label} » ?`)) cancel();
					}}
				>
					<input type="hidden" name="id" value={h.id} />
					<button
						type="submit"
						class="rec-action-btn"
						title="Supprimer"
						aria-label="Supprimer {h.label}"
						onclick={(e) => e.stopPropagation()}
					>
						<Icon name="trash" size={14} />
					</button>
				</form>
			</div>
		{/each}
	</div>
{/each}

{#if data.holdings.length === 0}
	<div class="card" style="margin-top: 22px; text-align: center; padding: 40px;">
		<p style="color: var(--text-muted); margin: 0 0 14px;">
			Ajoutez vos ETF, actions et cryptos : les cours sont mis à jour automatiquement.
		</p>
		<button type="button" class="btn btn-primary" onclick={openAdd}>
			<Icon name="plus" size={14} /> Ajouter une position
		</button>
	</div>
{/if}

{#if modalOpen}
	<HoldingModal holding={editing} {wallets} onclose={() => (modalOpen = false)} />
{/if}

<style>
	.gain {
		color: oklch(0.5 0.1 155);
	}
	.loss {
		color: oklch(0.5 0.15 25);
	}
	.empty {
		padding: 30px 10px;
		text-align: center;
		color: var(--text-muted);
		font-size: 13px;
	}
	.history {
		width: 100%;
		height: 160px;
		display: block;
	}
	.history-scale {
		display: flex;
		justify-content: space-between;
		font-size: 11.5px;
		color: var(--text-muted);
		margin-top: 8px;
	}
	.alloc-bar {
		display: flex;
		height: 10px;
		border-radius: 5px;
		overflow: hidden;
		background: var(--bg-sunk);
		margin-bottom: 14px;
	}
	.alloc-row {
		display: grid;
		grid-template-columns: 1fr 48px auto;
		gap: 10px;
		align-items: center;
		padding: 5px 0;
		font-size: 13px;
	}
	.alloc-name {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.alloc-pct {
		color: var(--text-muted);
		text-align: right;
	}
	.alloc-sep {
		border-top: 1px solid var(--border);
		margin: 10px 0;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
	}
	.pos-row {
		display: grid;
		grid-template-columns: 36px 1fr 130px 110px 150px 32px;
		align-items: center;
		gap: 14px;
		padding: 14px 22px;
		border-top: 1px solid var(--border);
		cursor: pointer;
	}
	.pos-row:first-of-type {
		border-top: none;
	}
	.pos-row:hover {
		background: oklch(0.99 0.005 80);
	}
	.pos-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: var(--bg-sunk);
		display: grid;
		place-items: center;
		font-weight: 600;
		font-size: 13px;
	}
	.pos-main {
		min-width: 0;
	}
	.pos-label {
		font-size: 14px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pos-meta {
		font-size: 12px;
		color: var(--text-muted);
	}
	.pos-qty,
	.pos-price,
	.pos-value {
		text-align: right;
		font-size: 13.5px;
	}
	.pos-value > div:first-child {
		font-weight: 500;
		font-size: 14px;
	}
	.pos-gain {
		font-size: 12px;
	}
	@media (max-width: 1024px) {
		.pos-row {
			grid-template-columns: 32px 1fr auto 32px;
			gap: 10px;
			padding: 12px 16px;
		}
		.pos-qty,
		.pos-price {
			display: none;
		}
	}
</style>
