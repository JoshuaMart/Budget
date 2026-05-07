<script lang="ts">
	import { z } from 'zod';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';

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
		// autoSignIn=true in better-auth config → cookie is already set.
		await goto(resolve('/'), { invalidateAll: true });
	}
</script>

<div class="auth-shell">
	<form class="auth-card" onsubmit={submit}>
		<h1>Créer un compte</h1>
		<p class="sub">Quelques secondes, et tes enveloppes 50/30/20 sont prêtes.</p>

		<label>
			<span>Nom</span>
			<input bind:value={name} type="text" autocomplete="name" required />
		</label>

		<label>
			<span>Email</span>
			<input bind:value={email} type="email" autocomplete="email" required />
		</label>

		<label>
			<span>Mot de passe</span>
			<input bind:value={password} type="password" autocomplete="new-password" required />
			<small>8 caractères minimum.</small>
		</label>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'Création…' : 'Créer mon compte'}
		</button>

		<p class="alt">Déjà inscrit ? <a href={resolve('/login')}>Se connecter</a></p>
	</form>
</div>

<style>
	.auth-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 24px;
		background: #f8f9fb;
	}
	.auth-card {
		width: 100%;
		max-width: 360px;
		background: #fff;
		padding: 28px;
		border-radius: 12px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	h1 {
		margin: 0;
		font-size: 22px;
	}
	.sub {
		margin: -6px 0 4px;
		color: #6b7280;
		font-size: 13px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		color: #374151;
	}
	label small {
		color: #9ca3af;
		font-size: 11px;
	}
	input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
	}
	button {
		padding: 11px;
		background: #111827;
		color: #fff;
		border: 0;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		margin: 0;
		padding: 8px 10px;
		border-radius: 6px;
		background: #fee2e2;
		color: #991b1b;
		font-size: 13px;
	}
	.alt {
		margin: 4px 0 0;
		text-align: center;
		font-size: 13px;
		color: #6b7280;
	}
	.alt a {
		color: #111827;
		font-weight: 500;
	}
</style>
