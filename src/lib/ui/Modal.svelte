<script lang="ts">
	import type { Snippet } from 'svelte';

	import Icon from './Icon.svelte';

	let {
		title,
		subtitle,
		onclose,
		children
	}: {
		title: string;
		subtitle?: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window {onkeydown} />

<div
	class="modal-backdrop"
	role="presentation"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<div class="modal" role="dialog" aria-modal="true" aria-label={title}>
		<button type="button" class="modal-close" onclick={onclose} aria-label="Fermer">
			<Icon name="x" size={16} />
		</button>
		<h2>{title}</h2>
		{#if subtitle}<p class="sub">{subtitle}</p>{/if}
		{@render children()}
	</div>
</div>
