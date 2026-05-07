<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { modals } from '$lib/modals.svelte';

	import Icon from './Icon.svelte';

	let {
		initial
	}: {
		initial: { necessities: number; wants: number; investments: number };
	} = $props();

	let necessities = $state(initial.necessities);
	let wants = $state(initial.wants);
	let investments = $state(initial.investments);
	let serverError = $state('');

	const sum = $derived(necessities + wants + investments);
	const valid = $derived(
		sum === 100 && [necessities, wants, investments].every((n) => n >= 0 && n <= 100)
	);

	function close() {
		modals.closeRatios();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	function reset() {
		necessities = 50;
		wants = 30;
		investments = 20;
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
		action="/?/updateRatios"
		style="position: relative;"
		use:enhance={({ cancel }) => {
			if (!valid) {
				cancel();
				serverError = 'La somme des ratios doit être 100.';
				return;
			}
			return async ({ result, update }) => {
				if (result.type === 'success') {
					await invalidateAll();
					close();
				} else if (result.type === 'failure') {
					serverError = (result.data?.error as string) ?? 'Sauvegarde impossible';
					await update();
				} else {
					await update();
				}
			};
		}}
	>
		<button type="button" class="modal-close" onclick={close} aria-label="Fermer">
			<Icon name="x" size={16} />
		</button>
		<h2>Ratios des enveloppes</h2>
		<p class="sub">Méthode 50/30/20 par défaut. La somme des trois doit faire 100&nbsp;%.</p>

		<div class="ratios-grid">
			<label class="field">
				<span><span class="dot nec"></span> Nécessités</span>
				<div class="ratio-input">
					<input
						type="number"
						name="necessities"
						min="0"
						max="100"
						step="1"
						bind:value={necessities}
					/>
					<span class="suffix">%</span>
				</div>
			</label>

			<label class="field">
				<span><span class="dot want"></span> Envies</span>
				<div class="ratio-input">
					<input type="number" name="wants" min="0" max="100" step="1" bind:value={wants} />
					<span class="suffix">%</span>
				</div>
			</label>

			<label class="field">
				<span><span class="dot inv"></span> Investissements</span>
				<div class="ratio-input">
					<input
						type="number"
						name="investments"
						min="0"
						max="100"
						step="1"
						bind:value={investments}
					/>
					<span class="suffix">%</span>
				</div>
			</label>
		</div>

		<div class="sum-line" class:valid class:invalid={!valid}>
			Somme :
			<strong>{sum}&nbsp;%</strong>
			{#if !valid}<span> — il faut atteindre 100&nbsp;%.</span>{/if}
		</div>

		{#if serverError}
			<p class="server-error" role="alert">{serverError}</p>
		{/if}

		<div class="modal-actions">
			<button type="button" class="btn btn-ghost" onclick={reset}>Réinitialiser 50/30/20</button>
			<div style="flex: 1;"></div>
			<button type="button" class="btn btn-ghost" onclick={close}>Annuler</button>
			<button type="submit" class="btn btn-primary" disabled={!valid}>Enregistrer</button>
		</div>
	</form>
</div>

<style>
	.ratios-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12px;
		margin: 8px 0 6px;
	}
	.field span {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.dot.nec {
		background: var(--nec);
	}
	.dot.want {
		background: var(--want);
	}
	.dot.inv {
		background: var(--inv);
	}
	.ratio-input {
		display: flex;
		align-items: center;
		gap: 4px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-elev);
		padding: 0 12px;
	}
	.ratio-input input {
		border: 0;
		background: none;
		padding: 10px 0;
		width: 100%;
		font-family: var(--font-mono);
		font-size: 16px;
		font-weight: 500;
	}
	.ratio-input input:focus {
		outline: none;
	}
	.suffix {
		color: var(--text-muted);
		font-size: 13px;
	}
	.sum-line {
		margin-top: 10px;
		font-size: 13px;
		color: var(--text-muted);
	}
	.sum-line.valid {
		color: var(--text);
	}
	.sum-line.invalid {
		color: oklch(0.5 0.18 25);
	}
	.server-error {
		margin: 12px 0 0;
		padding: 8px 10px;
		border-radius: 6px;
		background: oklch(0.95 0.04 25);
		color: oklch(0.4 0.18 25);
		font-size: 13px;
	}
	@media (max-width: 640px) {
		.ratios-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
