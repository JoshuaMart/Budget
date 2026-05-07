<script lang="ts">
	import { z } from 'zod';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import AuthShell from '$lib/ui/AuthShell.svelte';

	const schema = z.object({
		name: z.string().min(2, 'Nom trop court'),
		email: z.string().email('Email invalide'),
		password: z.string().min(8, 'Au moins 8 caractères')
	});

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const parsed = schema.safeParse({ name, email, password });
		if (!parsed.success) {
			error = parsed.error.issues[0]?.message ?? 'Données invalides';
			return;
		}
		loading = true;
		const { error: err } = await authClient.signUp.email({
			name: parsed.data.name,
			email: parsed.data.email,
			password: parsed.data.password
		});
		loading = false;
		if (err) {
			error = err.message ?? 'Impossible de créer le compte';
			return;
		}
		await goto(resolve('/'), { invalidateAll: true });
	}
</script>

<AuthShell>
	<h1 class="login-h1">Créer un compte</h1>
	<p class="login-sub">Quelques secondes pour démarrer.</p>

	<form onsubmit={submit}>
		<label class="field">
			<span>Nom</span>
			<input bind:value={name} type="text" placeholder="Ton prénom" autocomplete="name" required />
		</label>

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
				autocomplete="new-password"
				required
			/>
		</label>

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
			{loading ? 'Création…' : 'Créer le compte'}
		</button>
	</form>

	<p class="login-switch">
		Déjà inscrit ? <a class="login-link" href={resolve('/login')}>Se connecter</a>
	</p>
</AuthShell>
