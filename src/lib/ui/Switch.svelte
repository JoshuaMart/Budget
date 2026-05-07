<script lang="ts">
	let {
		on = $bindable(false),
		onchange,
		title
	}: {
		on?: boolean;
		onchange?: (next: boolean) => void;
		title?: string;
	} = $props();

	function toggle() {
		on = !on;
		onchange?.(on);
	}
</script>

<button
	type="button"
	class="rec-toggle"
	class:on
	role="switch"
	aria-checked={on}
	{title}
	onclick={toggle}
></button>
