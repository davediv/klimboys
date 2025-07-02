<script lang="ts">
	import { signUp } from '$lib/auth';
	import { UserPlus, Mail, Lock, User } from '@lucide/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleRegister() {
		if (!name || !email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await signUp.email({
				name,
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Registration failed';
			} else {
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
	<title>Register - Dashboard</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center p-4">
	<!-- Theme toggle in top right -->
	<div class="fixed top-4 right-4 z-10">
		<ThemeToggle />
	</div>
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<div class="mb-6 text-center">
				<UserPlus class="text-primary mx-auto mb-4 h-12 w-12" />
				<h1 class="text-2xl font-bold">Create Account</h1>
				<p class="text-base-content/70">Join our dashboard today</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleRegister();
				}}
				class="space-y-4"
			>
				<div class="form-control">
					<label class="label" for="name">
						<span class="label-text">Full Name</span>
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
							<User class="text-base-content/50 h-5 w-5" />
						</div>
						<input
							id="name"
							type="text"
							bind:value={name}
							placeholder="Enter your full name"
							class="input input-bordered w-full pl-10"
							required
						/>
					</div>
				</div>

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

				<div class="form-control">
					<label class="label" for="confirmPassword">
						<span class="label-text">Confirm Password</span>
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
							<Lock class="text-base-content/50 h-5 w-5" />
						</div>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							placeholder="Confirm your password"
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
						Creating account...
					{:else}
						Create Account
					{/if}
				</button>
			</form>

			<div class="divider">OR</div>

			<div class="text-center">
				<p class="text-base-content/70 text-sm">
					Already have an account?
					<a href="/login" class="link link-primary">Sign in</a>
				</p>
			</div>
		</div>
	</div>
</div>