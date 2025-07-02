<script lang="ts">
	import { signIn } from '$lib/auth';
	import { LogIn, Mail, Lock } from '@lucide/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { goto } from '$app/navigation';
	import { notifications } from '$lib/stores/notifications';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await signIn.email({
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Login failed';
				notifications.error('Login Failed', error);
			} else {
				notifications.success('Welcome back!', 'Login successful');
				goto('/dashboard');
			}
		} catch (e) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Dashboard</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center p-4">
	<!-- Theme toggle in top right -->
	<div class="fixed top-4 right-4 z-10">
		<ThemeToggle />
	</div>
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<div class="mb-6 text-center">
				<LogIn class="text-primary mx-auto mb-4 h-12 w-12" />
				<h1 class="text-2xl font-bold">Welcome Back</h1>
				<p class="text-base-content/70">Sign in to your account</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleLogin();
				}}
				class="space-y-4"
			>
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
							<Mail class="text-base-content/50 h-5 w-5" />
						</div>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="Enter your email"
							class="input input-bordered w-full pl-10"
							required
						/>
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
							<Lock class="text-base-content/50 h-5 w-5" />
						</div>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="Enter your password"
							class="input input-bordered w-full pl-10"
							required
						/>
					</div>
				</div>

				{#if error}
					<div class="alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
						Signing in...
					{:else}
						Sign In
					{/if}
				</button>
			</form>

			<div class="divider">OR</div>

			<div class="text-center">
				<p class="text-base-content/70 text-sm">
					Don't have an account?
					<a href="/register" class="link link-primary">Sign up</a>
				</p>
			</div>
		</div>
	</div>
</div>
