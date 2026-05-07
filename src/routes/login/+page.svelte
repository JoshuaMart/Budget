<script lang="ts">
	import { z } from 'zod';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import AuthShell from '$lib/ui/AuthShell.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const schema = z.object({
		email: z.string().email('Email invalide'),
		password: z.string().min(1, 'Mot de passe requis')
	});

	let email = $state('');
	let password = $state('');
	let remember = $state(true);
	let error = $state('');
	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const parsed = schema.safeParse({ email, password });
		if (!parsed.success) {
			error = parsed.error.issues[0]?.message ?? 'Données invalides';
			return;
		}
		loading = true;
		const { error: err } = await authClient.signIn.email({
			email: parsed.data.email,
			password: parsed.data.password
		});
		loading = false;
		if (err) {
			error = err.message ?? 'Identifiants invalides';
			return;
		}
		const next = page.url.searchParams.get('next') ?? '/';
		await goto(resolve(next as '/'), { invalidateAll: true });
	}
</script>

<AuthShell>
	<h1 class="login-h1">Bon retour</h1>
	<p class="login-sub">Connecte-toi pour suivre tes dépenses selon la méthode 50/30/20.</p>

	<form onsubmit={submit}>
		<label class="field">
			<span>Email</span>
			<input
				bind:value={email}
				type="email"
				placeholder="toi@example.com"
				autocomplete="email"
				required
			/>
		</label>

		<label class="field">
			<span>Mot de passe</span>
			<input
				bind:value={password}
				type="password"
				placeholder="••••••••"
				autocomplete="current-password"
				required
			/>
		</label>

		<div class="login-remember">
			<button
				type="button"
				class="login-check"
				class:on={remember}
				aria-label="Rester connecté"
				aria-pressed={remember}
				onclick={() => (remember = !remember)}
			>
				{#if remember}<Icon name="x" size={10} />{/if}
			</button>
			<span>Rester connecté sur cet appareil</span>
		</div>

		{#if error}
			<p
				role="alert"
				style="margin: 0 0 12px; padding: 8px 10px; border-radius: 6px; background: oklch(0.95 0.04 25); color: oklch(0.40 0.18 25); font-size: 13px;"
			>
				{error}
			</p>
		{/if}

		<button
			type="submit"
			class="btn btn-primary"
			disabled={loading}
			style="width: 100%; justify-content: center; padding: 12px; font-size: 14px; margin-top: 6px;"
		>
			{loading ? 'Connexion…' : 'Se connecter'}
		</button>
	</form>

	{#if data.signupEnabled}
		<p class="login-switch">
			Pas encore de compte ?
			<a class="login-link" href={resolve('/register')}>Créer un compte</a>
		</p>
	{/if}
</AuthShell>
