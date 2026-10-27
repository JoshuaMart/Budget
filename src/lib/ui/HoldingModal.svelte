<script lang="ts">
	import type { AssetClass } from '#lib/domain/index.ts';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import Icon from './Icon.svelte';

	export interface HoldingDraft {
		id: string;
		assetClass: AssetClass;
		wallet: string;
		symbol: string;
		label: string;
		quantity: number;
		avgCostCents: number;
	}

	interface SymbolMatch {
		symbol: string;
		label: string;
		exchange: string;
	}

	let {
		holding,
		wallets,
		onclose
	}: { holding?: HoldingDraft; wallets: string[]; onclose: () => void } = $props();

	const DEFAULT_WALLET: Record<AssetClass, string> = { etf: 'PEA', stock: 'CTO', crypto: 'Crypto' };
	const SEARCH_HINT: Record<AssetClass, string> = {
		etf: 'Nom ou ticker : MSCI World, CW8…',
		stock: 'Nom ou ticker : Air Liquide, AAPL…',
		crypto: 'Nom : Bitcoin, Ethereum, Solana…'
	};

	// Seeded once from the prop: the modal is remounted for each holding.
	const initial = $state.snapshot(holding);
	let assetClass = $state<AssetClass>(initial?.assetClass ?? 'etf');
	let symbol = $state(initial?.symbol ?? '');
	let label = $state(initial?.label ?? '');
	let wallet = $state(initial?.wallet ?? 'PEA');
	let quantity = $state(initial ? String(initial.quantity).replace('.', ',') : '');
	let avgCost = $state(initial ? (initial.avgCostCents / 100).toFixed(2).replace('.', ',') : '');

	let query = $state('');
	let matches = $state<SymbolMatch[]>([]);
	let searching = $state(false);
	let error = $state('');
	let saving = $state(false);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	const isEdit = !!initial;

	const CLASS_TABS: { value: AssetClass; label: string }[] = [
		{ value: 'etf', label: 'ETF' },
		{ value: 'stock', label: 'Action' },
		{ value: 'crypto', label: 'Crypto' }
	];

	function setClass(next: AssetClass) {
		if (next === assetClass) return;
		// Each class has its own quote source: a picked symbol doesn't carry over.
		if (wallet === DEFAULT_WALLET[assetClass]) wallet = DEFAULT_WALLET[next];
		assetClass = next;
		symbol = '';
		label = '';
		matches = [];
		scheduleSearch();
	}

	function scheduleSearch() {
		clearTimeout(searchTimer);
		const q = query.trim();
		if (q.length < 2) {
			matches = [];
			return;
		}
		searchTimer = setTimeout(async () => {
			searching = true;
			try {
				const res = await fetch(
					`/api/quotes/search?q=${encodeURIComponent(q)}&class=${assetClass}`
				);
				matches = res.ok ? await res.json() : [];
			} catch {
				matches = [];
			} finally {
				searching = false;
			}
		}, 300);
	}

	function pick(m: SymbolMatch) {
		symbol = m.symbol;
		label = m.label;
		matches = [];
		query = '';
	}
</script>

<div
	class="modal-backdrop"
	role="presentation"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<form
		class="modal"
		method="POST"
		action={isEdit ? '?/update' : '?/create'}
		style="position: relative;"
		use:enhance={() => {
			saving = true;
			error = '';
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					await invalidateAll();
					onclose();
				} else if (result.type === 'failure') {
					error = String(result.data?.error ?? 'Enregistrement impossible');
				} else {
					await update();
				}
			};
		}}
	>
		<button type="button" class="modal-close" onclick={onclose} aria-label="Fermer">
			<Icon name="x" size={16} />
		</button>
		<h2>{isEdit ? 'Modifier la position' : 'Nouvelle position'}</h2>
		<p class="sub">Le cours est récupéré automatiquement (Yahoo Finance / CoinGecko).</p>

		{#if isEdit}<input type="hidden" name="id" value={initial?.id} />{/if}
		<input type="hidden" name="assetClass" value={assetClass} />
		<input type="hidden" name="symbol" value={symbol} />

		<div class="modal-tabs">
			{#each CLASS_TABS as t (t.value)}
				<button
					type="button"
					class="modal-tab"
					class:active={assetClass === t.value}
					onclick={() => setClass(t.value)}
				>
					{t.label}
				</button>
			{/each}
		</div>

		<div class="field picker">
			<label for="holding-search">Actif</label>
			{#if symbol}
				<div class="picked">
					<div>
						<div class="picked-label">{label}</div>
						<div class="picked-symbol num">{symbol}</div>
					</div>
					<button type="button" class="btn btn-ghost" onclick={() => (symbol = '')}>Changer</button>
				</div>
			{:else}
				<input
					id="holding-search"
					type="search"
					autocomplete="off"
					placeholder={SEARCH_HINT[assetClass]}
					bind:value={query}
					oninput={scheduleSearch}
				/>
				{#if searching}
					<div class="matches-empty">Recherche…</div>
				{:else if matches.length}
					<ul class="matches">
						{#each matches as m (m.symbol)}
							<li>
								<button type="button" onclick={() => pick(m)}>
									<span class="m-label">{m.label}</span>
									<span class="m-meta num">{m.symbol}{m.exchange ? ` · ${m.exchange}` : ''}</span>
								</button>
							</li>
						{/each}
					</ul>
				{:else if query.trim().length >= 2}
					<div class="matches-empty">Aucun résultat.</div>
				{/if}
			{/if}
		</div>

		<div class="field">
			<label for="holding-label">Libellé</label>
			<input id="holding-label" name="label" bind:value={label} required maxlength="80" />
		</div>

		<div class="grid-2">
			<div class="field">
				<label for="holding-qty">Quantité</label>
				<input
					id="holding-qty"
					name="quantity"
					inputmode="decimal"
					placeholder={assetClass === 'crypto' ? '0,05' : '10'}
					bind:value={quantity}
					required
				/>
			</div>
			<div class="field">
				<label for="holding-pru">Prix de revient unitaire (€)</label>
				<input
					id="holding-pru"
					name="avgCost"
					inputmode="decimal"
					placeholder="0,00"
					bind:value={avgCost}
					required
				/>
			</div>
		</div>

		<div class="field">
			<label for="holding-wallet">Enveloppe / support</label>
			<input
				id="holding-wallet"
				name="wallet"
				list="holding-wallets"
				bind:value={wallet}
				required
				maxlength="40"
			/>
			<datalist id="holding-wallets">
				{#each [...new Set(['PEA', 'CTO', 'Crypto', ...wallets])] as w (w)}
					<option value={w}></option>
				{/each}
			</datalist>
		</div>

		{#if error}<div class="form-error">{error}</div>{/if}

		<div class="modal-actions">
			<button type="button" class="btn btn-ghost" onclick={onclose}>Annuler</button>
			<button type="submit" class="btn btn-primary" disabled={saving || !symbol}>
				{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
			</button>
		</div>
	</form>
</div>

<style>
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.picked {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		background: var(--bg-sunk);
		border-radius: 9px;
	}
	.picked-label {
		font-size: 14px;
		font-weight: 500;
	}
	.picked-symbol,
	.m-meta {
		font-size: 12px;
		color: var(--text-muted);
	}
	.matches {
		list-style: none;
		margin: 4px 0 0;
		padding: 4px;
		border: 1px solid var(--border);
		border-radius: 9px;
		max-height: 220px;
		overflow-y: auto;
	}
	.matches button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;
		padding: 8px 10px;
		border-radius: 6px;
		text-align: left;
	}
	.matches button:hover {
		background: var(--bg-sunk);
	}
	.m-label {
		font-size: 13.5px;
	}
	.matches-empty {
		font-size: 12.5px;
		color: var(--text-muted);
		padding: 6px 2px 0;
	}
	.form-error {
		color: oklch(0.45 0.18 25);
		font-size: 13px;
		margin-top: 4px;
	}
	@media (max-width: 640px) {
		.grid-2 {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}
</style>
