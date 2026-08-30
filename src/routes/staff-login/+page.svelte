<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from '@lucide/svelte';
	import Logo from '$lib/assets/logo.svg';
	import { alertStyles, buttonStyles, cx, inputStyles, spinnerStyles } from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	async function handleLogin(event: SubmitEvent) {
		event.preventDefault();
		error = '';

		if (!email || !password) {
			error = 'Email and password are required.';
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/auth/sign-in/email', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!response.ok) {
				let message = 'The email or password is incorrect.';
				try {
					const body = (await response.json()) as { message?: string };
					message = body.message || message;
				} catch {
					// Keep the safe fallback when the auth service returns no JSON body.
				}
				throw new Error(message);
			}

			await goto(data.redirectTo);
		} catch (loginError) {
			error = loginError instanceof Error ? loginError.message : 'Sign-in failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Staff Sign In - Klimboys</title>
	<meta name="description" content="Secure sign-in for authorized Klimboys staff." />
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-red-50 px-4 py-12"
>
	<div class="w-full max-w-md">
		<a
			href="/"
			class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to public website
		</a>

		<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
			<div class="mb-8 text-center">
				<img src={Logo} alt="Klimboys" class="mx-auto h-14 w-auto" />
				<div class="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-brand">
					<ShieldCheck class="h-5 w-5" />
					Staff workspace
				</div>
				<h1 class="mt-2 text-3xl font-bold text-gray-900">Sign in</h1>
				<p class="mt-2 text-gray-600">For authorized Klimboys team members only.</p>
			</div>

			{#if data.accountsManaged}
				<div class={cx(alertStyles('caution'), 'mb-6')} role="status">
					Staff accounts are provisioned by an administrator. Contact your manager for access.
				</div>
			{/if}
			{#if data.emailVerified}
				<div class={cx(alertStyles('positive'), 'mb-6')} role="status">
					Your email is verified. You can now sign in.
				</div>
			{/if}

			{#if error}
				<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{error}</div>
			{/if}

			<form onsubmit={handleLogin} class="space-y-5">
				<div>
					<label for="staff-email" class="mb-2 block text-sm font-medium text-gray-700">
						Email address
					</label>
					<div class="relative">
						<Mail
							class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
						/>
						<input
							id="staff-email"
							name="email"
							type="email"
							autocomplete="username"
							required
							bind:value={email}
							disabled={loading}
							class={cx(inputStyles({ full: true }), 'pl-10')}
						/>
					</div>
				</div>

				<div>
					<label for="staff-password" class="mb-2 block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="relative">
						<Lock
							class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
						/>
						<input
							id="staff-password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:value={password}
							disabled={loading}
							class={cx(inputStyles({ full: true }), 'pr-12 pl-10')}
						/>
						<button
							type="button"
							onclick={togglePasswordVisibility}
							class="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center text-gray-500 hover:text-gray-900"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class={buttonStyles({ tone: 'brand', size: 'lg', block: true })}
				>
					{#if loading}
						<span class={spinnerStyles('sm')}></span>
						Signing in…
					{:else}
						Sign in to staff workspace
						<ArrowRight class="h-5 w-5" />
					{/if}
				</button>
			</form>
		</div>
	</div>
</main>
