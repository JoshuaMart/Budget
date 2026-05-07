<script lang="ts">
	import type { EnvelopeKey } from '$lib/domain';

	let {
		envelope,
		label
	}: {
		envelope: EnvelopeKey;
		label: string;
	} = $props();
</script>

<span class="envelope-tag env-{envelope}">
	<span class="envelope-tag-dot"></span>
	{label}
</span>
