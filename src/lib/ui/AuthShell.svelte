<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="login-page">
	<div class="login-left">
		<div class="login-brand">
			<div class="brand-mark">B</div>
			<span class="brand-name">Budget</span>
		</div>

		<div class="login-card">
			{@render children()}
		</div>

		<div class="login-foot">© 2026 Budget</div>
	</div>

	<div class="login-right">
		<div class="login-hero">
			<div class="login-hero-tag">Méthode 50 / 30 / 20</div>
			<div class="login-hero-title">
				Trois enveloppes.<br />
				Une vie financière<br />
				sereine.
			</div>

			<div class="login-hero-cards">
				<div class="login-hero-card env-necessities">
					<div class="login-hero-card-pct">50<span>%</span></div>
					<div class="login-hero-card-label">Nécessités</div>
					<div class="login-hero-card-bar"><span style="width: 64%"></span></div>
					<div class="login-hero-card-meta">€1 162 / €1 600</div>
				</div>
				<div class="login-hero-card env-wants">
					<div class="login-hero-card-pct">30<span>%</span></div>
					<div class="login-hero-card-label">Envies</div>
					<div class="login-hero-card-bar"><span style="width: 23%"></span></div>
					<div class="login-hero-card-meta">€220 / €960</div>
				</div>
				<div class="login-hero-card env-investments">
					<div class="login-hero-card-pct">20<span>%</span></div>
					<div class="login-hero-card-label">Investissements</div>
					<div class="login-hero-card-bar"><span style="width: 100%"></span></div>
					<div class="login-hero-card-meta">€650 / €640</div>
				</div>
			</div>

			<div class="login-hero-quote">
				« Mon loyer, mes courses, mon livret A »
				<div class="login-hero-quote-author">Camille</div>
			</div>
		</div>
	</div>
</div>
