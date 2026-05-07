<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { type EnvelopeKey, toIsoDate } from '$lib/domain';
	import { modals } from '$lib/modals.svelte';

	import Icon from './Icon.svelte';

	type Mode = 'expense' | 'transfer' | 'income';

	let {
		envelopes,
		categories,
		accounts,
		defaultMode
	}: {
		envelopes: { id: string; key: EnvelopeKey; label: string }[];
		categories: { id: string; envelopeId: string; label: string; isVirtual: boolean }[];
		accounts: { id: string; label: string }[];
		defaultMode: Mode;
	} = $props();

	// Modal is mounted via {#if open} in the layout, so initial values from
	// props are captured once per open — adequate for V1.
	let mode = $state<Mode>(defaultMode);

	let amount = $state('');
	let merchant = $state('');
	let envelopeId = $state(envelopes[0]?.id ?? '');
	let categoryId = $state('');
	let accountId = $state(accounts[0]?.id ?? '');
	let toAccountId = $state(accounts[1]?.id ?? accounts[0]?.id ?? '');
	let date = $state(toIsoDate(new Date()));
	let incomeCategory = $state('');

	const envelopeCats = $derived.by(() => {
		const all = categories.filter((c) => c.envelopeId === envelopeId);
		// Virtual "Non catégorisé" pinned last.
		return [...all.filter((c) => !c.isVirtual), ...all.filter((c) => c.isVirtual)];
	});
	$effect(() => {
		if (!envelopeCats.find((c) => c.id === categoryId)) {
			categoryId = envelopeCats[0]?.id ?? '';
		}
	});

	function close() {
		modals.closeAddTx();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

<div
	class="modal-backdrop"
	role="presentation"
	onclick={(e) => {
		if (e.target === e.currentTarget) close();
	}}
>
	<form
		class="modal"
		method="POST"
		action="/transactions?/create"
		style="position: relative;"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') {
					await invalidateAll();
					close();
				} else {
					await update();
				}
			}}
	>
		<button type="button" class="modal-close" onclick={close} aria-label="Fermer">
			<Icon name="x" size={16} />
		</button>
		<h2>Ajouter</h2>
		<p class="sub">Dépense, transfert entre comptes ou revenu.</p>

		<input type="hidden" name="kind" value={mode} />

		<div class="modal-tabs">
			<button
				type="button"
				class="modal-tab"
				class:active={mode === 'expense'}
				onclick={() => (mode = 'expense')}
			>
				Dépense
			</button>
			<button
				type="button"
				class="modal-tab"
				class:active={mode === 'transfer'}
				onclick={() => (mode = 'transfer')}
			>
				Transfert
			</button>
			<button
				type="button"
				class="modal-tab"
				class:active={mode === 'income'}
				onclick={() => (mode = 'income')}
			>
				Revenu
			</button>
		</div>

		<label class="field">
			<span>Montant</span>
			<div class="field-amount">
				<span class="currency">€</span>
				<input
					name="amount"
					type="text"
					inputmode="decimal"
					placeholder="0.00"
					bind:value={amount}
					required
				/>
			</div>
		</label>

		<label class="field">
			<span>{mode === 'transfer' ? 'Libellé' : 'Commerçant / Description'}</span>
			<input
				name="merchant"
				type="text"
				placeholder={mode === 'transfer'
					? 'Ex. Virement Livret A'
					: mode === 'income'
						? 'Ex. Salaire'
						: 'Ex. Carrefour Market'}
				bind:value={merchant}
				required
			/>
		</label>

		{#if mode === 'transfer'}
			<div class="transfer-row">
				<label class="field" style="margin-bottom: 0;">
					<span>Depuis</span>
					<select name="accountId" bind:value={accountId}>
						{#each accounts as a (a.id)}
							<option value={a.id}>{a.label}</option>
						{/each}
					</select>
				</label>
				<div class="transfer-arrow-icon"><Icon name="chevron-right" size={16} /></div>
				<label class="field" style="margin-bottom: 0;">
					<span>Vers</span>
					<select name="toAccountId" bind:value={toAccountId}>
						{#each accounts.filter((a) => a.id !== accountId) as a (a.id)}
							<option value={a.id}>{a.label}</option>
						{/each}
					</select>
				</label>
			</div>
		{/if}

		{#if mode !== 'income'}
			<label class="field" style="margin-top: {mode === 'transfer' ? '14px' : '0'};">
				<span>
					Enveloppe
					{#if mode === 'transfer'}
						<span style="text-transform: none; font-weight: 400; color: var(--text-subtle);">
							— pour la classification budgétaire
						</span>
					{/if}
				</span>
				<div class="envelope-radio">
					{#each envelopes as env (env.id)}
						<button
							type="button"
							class="envelope-radio-tile env-{env.key}"
							class:selected={envelopeId === env.id}
							onclick={() => (envelopeId = env.id)}
						>
							<span class="envelope-radio-name">
								<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--env);"
								></span>
								{env.label}
							</span>
							<span class="envelope-radio-meta">
								{categories.filter((c) => c.envelopeId === env.id && !c.isVirtual).length} catégories
							</span>
						</button>
					{/each}
				</div>
				<input type="hidden" name="envelopeId" value={envelopeId} />
			</label>

			<div
				style="display: grid; grid-template-columns: {mode === 'transfer'
					? '1fr'
					: '1fr 1fr'}; gap: 10px;"
			>
				<label class="field">
					<span>Catégorie</span>
					<select name="categoryId" bind:value={categoryId}>
						{#each envelopeCats as c (c.id)}
							<option value={c.id}>{c.label}</option>
						{/each}
					</select>
				</label>
				{#if mode !== 'transfer'}
					<label class="field">
						<span>Compte</span>
						<select name="accountId" bind:value={accountId}>
							{#each accounts as a (a.id)}
								<option value={a.id}>{a.label}</option>
							{/each}
						</select>
					</label>
				{/if}
			</div>
		{/if}

		{#if mode === 'income'}
			<label class="field">
				<span>Compte crédité</span>
				<select name="accountId" bind:value={accountId}>
					{#each accounts as a (a.id)}
						<option value={a.id}>{a.label}</option>
					{/each}
				</select>
			</label>

			<label class="field">
				<span>Catégorie de revenu (optionnel)</span>
				<select name="incomeCategory" bind:value={incomeCategory}>
					<option value="">Non spécifié</option>
					<option value="salary">Salaire</option>
					<option value="freelance">Freelance</option>
					<option value="autre">Autre</option>
				</select>
			</label>
		{/if}

		<label class="field">
			<span>Date</span>
			<input name="date" type="date" bind:value={date} required />
		</label>

		<div class="modal-actions">
			<button type="button" class="btn btn-ghost" onclick={close}>Annuler</button>
			<button type="submit" class="btn btn-primary">
				{mode === 'transfer' ? 'Effectuer le transfert' : 'Ajouter'}
			</button>
		</div>
	</form>
</div>
