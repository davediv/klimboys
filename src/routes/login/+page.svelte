<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from '@lucide/svelte';
	import Logo from '$lib/assets/logo.svg';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	// Check for redirect parameter
	let redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/dashboard');

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';

		if (!email || !password) {
			error = 'Email and password are required';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/sign-in/email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					password
				})
			});

			// Check if response is ok first
			if (!response.ok) {
				// Handle error response with defensive JSON parsing
				let errorMessage = 'Invalid credentials';
				try {
					const responseText = await response.text();
					if (responseText.trim()) {
						const errorData = JSON.parse(responseText);
						errorMessage = errorData?.message || errorMessage;
					}
				} catch (jsonError) {
					// If JSON parsing fails, use default error message
					console.warn('Failed to parse error response JSON:', jsonError);
				}
				throw new Error(errorMessage);
			}

			// Login successful - Better Auth handles session via cookies
			// Redirect immediately without trying to fetch session data
			// The session will be available in server-side locals after redirect
			await goto(redirectTo);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Klimboys</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-red-50 px-4 py-12"
>
	<!-- Decorative Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-[#FF6B6B]/20 to-orange-400/20 blur-3xl"
		></div>
		<div
			class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl"
		></div>
	</div>

	<div class="relative w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href="/" class="inline-block">
				<img src={Logo} alt="Klimboys" class="mx-auto h-16 w-auto" />
			</a>
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-sm">
			<!-- Header -->
			<div class="mb-8 text-center">
				<div
					class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E]"
				>
					<Sparkles class="h-8 w-8 text-white" />
				</div>
				<h2
					class="bg-gradient-to-r from-[#FF6B6B] to-orange-500 bg-clip-text text-3xl font-bold text-transparent"
				>
					Welcome Back!
				</h2>
				<p class="mt-2 text-gray-600">Sign in to continue to your account</p>
			</div>

			<!-- Success Message -->
			{#if $page.url.searchParams.get('verified') === 'true'}
				<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
					<div class="flex items-start">
						<svg class="mt-0.5 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">Email verified successfully!</h3>
							<p class="text-sm text-green-700">You can now sign in to your account.</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
					<div class="flex items-start">
						<svg class="mt-0.5 h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">{error}</h3>
						</div>
					</div>
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleLogin} class="space-y-6">
				<!-- Email Input -->
				<div>
					<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
						Email Address
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<Mail class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="block w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none"
							placeholder="Enter your email"
						/>
					</div>
				</div>

				<!-- Password Input -->
				<div>
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<Lock class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:value={password}
							class="block w-full rounded-lg border border-gray-300 py-2.5 pr-12 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none"
							placeholder="Enter your password"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600"
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

				<!-- Remember & Forgot -->
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							class="h-4 w-4 rounded border-gray-300 text-[#FF6B6B] focus:ring-[#FF6B6B]"
						/>
						<label for="remember-me" class="ml-2 block text-sm text-gray-700"> Remember me </label>
					</div>

					<a
						href="/forgot-password"
						class="text-sm font-medium text-[#FF6B6B] transition-colors hover:text-[#FF8E8E]"
					>
						Forgot password?
					</a>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={loading}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] px-4 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
				>
					{#if loading}
						<span class="loading loading-sm loading-spinner"></span>
						Signing in...
					{:else}
						Sign In
						<ArrowRight class="h-5 w-5" />
					{/if}
				</button>

				<!-- Divider -->
				<div class="relative my-6">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-white px-4 text-gray-500">Don't have an account?</span>
					</div>
				</div>

				<!-- Register Link -->
				<a
					href="/register"
					class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#FF6B6B] bg-white px-4 py-3 font-semibold text-[#FF6B6B] transition-all duration-300 hover:bg-[#FF6B6B]/5"
				>
					Create New Account
				</a>
			</form>
		</div>

		<!-- Footer -->
		<p class="mt-8 text-center text-sm text-gray-600">
			© {new Date().getFullYear()} Klimboys. All rights reserved.
		</p>
	</div>
</div>
