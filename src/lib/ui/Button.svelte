<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'ghost';

	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		onclick,
		children,
		title
	}: {
		variant?: Variant;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		title?: string;
		children: Snippet;
	} = $props();
</script>

<button {type} {disabled} {onclick} {title} class="btn btn-{variant}">
	{@render children()}
</button>
