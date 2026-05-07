<script lang="ts" generics="T extends string">
	let {
		value = $bindable<T>(),
		options
	}: {
		value: T;
		options: { value: T; label: string }[];
	} = $props();
</script>

<div class="modal-tabs">
	{#each options as opt (opt.value)}
		<button
			type="button"
			class="modal-tab"
			class:active={value === opt.value}
			onclick={() => (value = opt.value)}
		>
			{opt.label}
		</button>
	{/each}
</div>
