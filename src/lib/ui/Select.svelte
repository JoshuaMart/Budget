<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';

	let {
		value = $bindable<T>(),
		label,
		options,
		children
	}: {
		value: T;
		label?: string;
		options?: { value: T; label: string }[];
		children?: Snippet;
	} = $props();
</script>

<label class="field">
	{#if label}<span class="field-label">{label}</span>{/if}
	<select bind:value>
		{#if options}
			{#each options as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		{:else if children}
			{@render children()}
		{/if}
	</select>
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
	select {
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-elev);
		font-size: 14px;
	}
	select:focus {
		outline: none;
		border-color: var(--text);
	}
</style>
