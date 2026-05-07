<script lang="ts">
	import { type EnvelopeKey, formatCents } from '$lib/domain';

	import Money from './Money.svelte';

	interface Slice {
		envelopeKey: EnvelopeKey;
		label: string;
		spentCents: number;
		budgetCents: number;
		color: string;
	}

	let { slices, totalSpentCents }: { slices: Slice[]; totalSpentCents: number } = $props();

	const size = 180;
	const stroke = 28;
	const r = (size - stroke) / 2;
	const c = 2 * Math.PI * r;
	const total = $derived(slices.reduce((s, d) => s + d.spentCents, 0));

	const segments = $derived.by(() => {
		let offset = 0;
		return slices.map((d) => {
			const portion = total > 0 ? d.spentCents / total : 0;
			const len = portion * c;
			const seg = { ...d, dasharray: `${len} ${c - len}`, dashoffset: -offset };
			offset += len;
			return seg;
		});
	});

	void formatCents;
</script>

<div class="donut-wrap">
	<svg class="donut-svg" width={size} height={size} viewBox="0 0 {size} {size}">
		<circle
			cx={size / 2}
			cy={size / 2}
			{r}
			fill="none"
			stroke="var(--bg-sunk)"
			stroke-width={stroke}
		/>
		{#each segments as s (s.envelopeKey)}
			<circle
				cx={size / 2}
				cy={size / 2}
				{r}
				fill="none"
				stroke={s.color}
				stroke-width={stroke}
				stroke-dasharray={s.dasharray}
				stroke-dashoffset={s.dashoffset}
				transform="rotate(-90 {size / 2} {size / 2})"
				style="transition: stroke-dasharray 0.4s;"
			/>
		{/each}
		<text
			x="50%"
			y="48%"
			text-anchor="middle"
			font-size="11"
			fill="var(--text-muted)"
			font-weight="500"
		>
			Dépensé
		</text>
		<text
			x="50%"
			y="58%"
			text-anchor="middle"
			font-size="20"
			font-family="var(--font-mono)"
			font-weight="500"
			fill="var(--text)"
		>
			{formatCents(totalSpentCents, { compact: true })}
		</text>
	</svg>

	<div class="donut-legend">
		{#each slices as d (d.envelopeKey)}
			{@const pct = total > 0 ? (d.spentCents / total) * 100 : 0}
			<div class="donut-legend-row">
				<div class="donut-legend-top">
					<span class="donut-legend-label">
						<span class="donut-legend-dot" style="background: {d.color};"></span>
						{d.label}
					</span>
					<span class="donut-legend-amount num"><Money cents={d.spentCents} compact /></span>
				</div>
				<div class="donut-legend-bar">
					<div class="donut-legend-bar-fill" style="width: {pct}%; background: {d.color};"></div>
				</div>
				<div class="donut-legend-meta">
					{Math.round(pct)}% des dépenses · budget <Money cents={d.budgetCents} compact />
				</div>
			</div>
		{/each}
	</div>
</div>
