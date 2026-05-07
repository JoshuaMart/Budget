<script lang="ts">
	import { formatCents } from '$lib/domain';

	let {
		cents,
		signed = false,
		compact = false
	}: {
		cents: number;
		signed?: boolean;
		compact?: boolean;
	} = $props();
</script>

<span class="num">{formatCents(cents, { signed, compact })}</span>
