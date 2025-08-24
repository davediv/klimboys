<script lang="ts">
	import { User, Mail, Lock, ArrowRight, UserPlus, CheckCircle, Eye, EyeOff } from '@lucide/svelte';
	import Logo from '$lib/assets/logo.svg';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let error = $state('');
	let loading = $state(false);
	let registered = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';

		// Validation
		if (!email || !password || !confirmPassword) {
			error = 'All fields are required';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/sign-up/email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					password,
					name: name || undefined
				})
			});

			// Check if response is ok first
			if (!response.ok) {
				// Only try to parse JSON if there's an error
				let errorMessage = 'Registration failed';
				try {
					const errorData = (await response.json()) as { message?: string };
					errorMessage = errorData?.message || errorMessage;
				} catch {
					// If JSON parsing fails, use default error message
				}
				throw new Error(errorMessage);
			}

			// For successful registration, Better Auth might return empty response
			registered = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Register - Klimboys</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4 py-12"
>
	<!-- Decorative Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-orange-400/20 to-[#FF6B6B]/20 blur-3xl"
		></div>
		<div
			class="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-gradient-to-br from-pink-400/20 to-purple-400/20 blur-3xl"
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
			{#if !registered}
				<!-- Header -->
				<div class="mb-8 text-center">
					<div
						class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-[#FF6B6B]"
					>
						<UserPlus class="h-8 w-8 text-white" />
					</div>
					<h2
						class="bg-gradient-to-r from-orange-500 to-[#FF6B6B] bg-clip-text text-3xl font-bold text-transparent"
					>
						Create Account
					</h2>
					<p class="mt-2 text-gray-600">Join us for amazing milkshake experiences</p>
				</div>

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
				<form onsubmit={handleRegister} class="space-y-6">
					<!-- Name Input -->
					<div>
						<label for="name" class="mb-2 block text-sm font-medium text-gray-700">
							Full Name (Optional)
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<User class="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="name"
								name="name"
								type="text"
								autocomplete="name"
								bind:value={name}
								class="block w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none"
								placeholder="Enter your full name"
							/>
						</div>
					</div>

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
								autocomplete="new-password"
								required
								bind:value={password}
								class="block w-full rounded-lg border border-gray-300 py-2.5 pr-12 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none"
								placeholder="Create a password (min. 8 characters)"
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

					<!-- Confirm Password Input -->
					<div>
						<label for="confirm-password" class="mb-2 block text-sm font-medium text-gray-700">
							Confirm Password
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Lock class="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="confirm-password"
								name="confirm-password"
								type={showConfirmPassword ? 'text' : 'password'}
								autocomplete="new-password"
								required
								bind:value={confirmPassword}
								class="block w-full rounded-lg border border-gray-300 py-2.5 pr-12 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none"
								placeholder="Confirm your password"
							/>
							<button
								type="button"
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
								class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600"
								aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
							>
								{#if showConfirmPassword}
									<EyeOff class="h-5 w-5" />
								{:else}
									<Eye class="h-5 w-5" />
								{/if}
							</button>
						</div>
					</div>

					<!-- Terms Checkbox -->
					<div class="flex items-start">
						<input
							id="terms"
							name="terms"
							type="checkbox"
							required
							class="mt-1 h-4 w-4 rounded border-gray-300 text-[#FF6B6B] focus:ring-[#FF6B6B]"
						/>
						<label for="terms" class="ml-2 block text-sm text-gray-700">
							I agree to the <a href="/terms" class="text-[#FF6B6B] hover:text-[#FF8E8E]"
								>Terms of Service</a
							>
							and <a href="/privacy" class="text-[#FF6B6B] hover:text-[#FF8E8E]">Privacy Policy</a>
						</label>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] px-4 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
					>
						{#if loading}
							<span class="loading loading-sm loading-spinner"></span>
							Creating Account...
						{:else}
							Create Account
							<ArrowRight class="h-5 w-5" />
						{/if}
					</button>

					<!-- Divider -->
					<div class="relative my-6">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-300"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="bg-white px-4 text-gray-500">Already have an account?</span>
						</div>
					</div>

					<!-- Login Link -->
					<a
						href="/login"
						class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#FF6B6B] bg-white px-4 py-3 font-semibold text-[#FF6B6B] transition-all duration-300 hover:bg-[#FF6B6B]/5"
					>
						Sign In to Existing Account
					</a>
				</form>
			{:else}
				<!-- Success Message -->
				<div class="text-center">
					<div
						class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600"
					>
						<CheckCircle class="h-10 w-10 text-white" />
					</div>
					<h2 class="mb-4 text-3xl font-bold text-gray-800">Registration Successful!</h2>
					<div class="space-y-4 text-gray-600">
						<p>We've sent a verification email to:</p>
						<p class="text-lg font-semibold text-[#FF6B6B]">{email}</p>
						<p>Please check your email and click the verification link to activate your account.</p>
						<div class="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
							<p class="text-sm text-orange-800">
								<strong>For development:</strong> Check the console/terminal for the verification link.
							</p>
						</div>
						<div class="mt-8">
							<a
								href="/login"
								class="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
							>
								Go to Login
								<ArrowRight class="h-5 w-5" />
							</a>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<p class="mt-8 text-center text-sm text-gray-600">
			© {new Date().getFullYear()} Klimboys. All rights reserved.
		</p>
	</div>
</div>
