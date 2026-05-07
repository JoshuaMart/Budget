<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { modals } from '$lib/modals.svelte';

	import Icon from './Icon.svelte';

	interface AccountRow {
		id: string;
		label: string;
		initialBalanceCents: number;
		type: 'checking' | 'savings';
		_new?: boolean;
		_deleted?: boolean;
	}

	let {
		initialAccounts
	}: {
		initialAccounts: {
			id: string;
			label: string;
			initialBalanceCents: number;
			type: 'checking' | 'savings';
		}[];
	} = $props();

	let rows = $state<AccountRow[]>(initialAccounts.map((a) => ({ ...a })));
	let saving = $state(false);
	let error = $state('');

	function addRow() {
		rows = [
			...rows,
			{
				id: 'new-' + crypto.randomUUID(),
				label: 'Nouveau compte',
				initialBalanceCents: 0,
				type: 'checking',
				_new: true
			}
		];
	}

	function removeRow(id: string) {
		const r = rows.find((x) => x.id === id);
		if (!r) return;
		if (r._new) rows = rows.filter((x) => x.id !== id);
		else rows = rows.map((x) => (x.id === id ? { ...x, _deleted: true } : x));
	}

	async function save() {
		saving = true;
		error = '';
		const payload = {
			create: rows
				.filter((r) => r._new && !r._deleted)
				.map(({ label, initialBalanceCents, type }) => ({
					label,
					initialBalanceCents,
					type
				})),
			update: rows
				.filter((r) => !r._new && !r._deleted)
				.map(({ id, label, initialBalanceCents, type }) => ({
					id,
					label,
					initialBalanceCents,
					type
				})),
			delete: rows.filter((r) => !r._new && r._deleted).map((r) => r.id)
		};
		const res = await fetch('/api/accounts', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		saving = false;
		if (!res.ok) {
			error = 'Sauvegarde impossible';
			return;
		}
		await invalidateAll();
		modals.closeAccounts();
	}

	function close() {
		modals.closeAccounts();
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
	<div class="modal" style="position: relative; width: 520px;">
		<button type="button" class="modal-close" onclick={close} aria-label="Fermer">
			<Icon name="x" size={16} />
		</button>
		<h2>Comptes</h2>
		<p class="sub">Renomme un compte, ajuste son solde initial ou ajoute-en un nouveau.</p>

		<div style="margin-bottom: 14px;">
			{#each rows.filter((r) => !r._deleted) as r (r.id)}
				<div class="acct-edit-row">
					<input class="name" bind:value={r.label} />
					<input
						class="bal"
						type="number"
						step="0.01"
						value={r.initialBalanceCents / 100}
						oninput={(e) => {
							r.initialBalanceCents = Math.round(
								Number.parseFloat(e.currentTarget.value || '0') * 100
							);
						}}
					/>
					<span style="font-size: 12px; color: var(--text-muted);">€</span>
					<button type="button" class="del-btn" onclick={() => removeRow(r.id)} title="Supprimer">
						<Icon name="trash" size={14} />
					</button>
				</div>
			{/each}
		</div>

		<button
			type="button"
			class="btn btn-ghost"
			onclick={addRow}
			style="width: 100%; justify-content: center;"
		>
			<Icon name="plus" size={14} /> Ajouter un compte
		</button>

		{#if error}
			<p
				role="alert"
				style="margin: 12px 0 0; padding: 8px 10px; border-radius: 6px; background: oklch(0.95 0.04 25); color: oklch(0.40 0.18 25); font-size: 13px;"
			>
				{error}
			</p>
		{/if}

		<div class="modal-actions">
			<button type="button" class="btn btn-ghost" onclick={close}>Annuler</button>
			<button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
				{saving ? 'Enregistrement…' : 'Enregistrer'}
			</button>
		</div>
	</div>
</div>
