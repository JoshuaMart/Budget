<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = HTMLInputAttributes & {
		value?: string;
		label?: string;
		error?: string;
	};

	let { value = $bindable(''), label, error, type = 'text', ...rest }: Props = $props();
</script>

<label class="field">
	{#if label}<span class="field-label">{label}</span>{/if}
	<input bind:value {type} {...rest} class:error={!!error} />
	{#if error}<small class="field-error">{error}</small>{/if}
</label>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.field-label {
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	input {
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-elev);
		font-size: 14px;
	}
	input:focus {
		outline: none;
		border-color: var(--text);
	}
	input.error {
		border-color: oklch(0.55 0.18 25);
	}
	.field-error {
		color: oklch(0.45 0.18 25);
		font-size: 11px;
	}
</style>
