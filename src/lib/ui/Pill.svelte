<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { EnvelopeKey } from '$lib/domain';

	let {
		active = false,
		envelope,
		onclick,
		children
	}: {
		active?: boolean;
		envelope?: EnvelopeKey;
		onclick?: () => void;
		children: Snippet;
	} = $props();
</script>

<button
	type="button"
	class="tx-filter-pill"
	class:active
	class:env-necessities={envelope === 'necessities'}
	class:env-wants={envelope === 'wants'}
	class:env-investments={envelope === 'investments'}
	{onclick}
>
	{#if envelope}
		<span
			style="width: 6px; height: 6px; border-radius: 50%; background: {active
				? 'currentColor'
				: 'var(--env)'};"
		></span>
	{/if}
	{@render children()}
</button>
