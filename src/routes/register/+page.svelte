<script lang="ts">
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let error = $state('');
	let loading = $state(false);
	let registered = $state(false);

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
					const errorData = await response.json();
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

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Or
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
					sign in to your existing account
				</a>
			</p>
		</div>

		{#if registered}
			<div class="rounded-md bg-green-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-green-800">Registration successful!</h3>
						<div class="mt-2 text-sm text-green-700">
							<p>
								We've sent a verification email to <strong>{email}</strong>. Please check your email
								and click the verification link to activate your account.
							</p>
							<p class="mt-2">
								For development: Check the console/terminal for the verification link.
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<form class="mt-8 space-y-6" onsubmit={handleRegister}>
				{#if error}
					<div class="rounded-md bg-red-50 p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-red-800">{error}</h3>
							</div>
						</div>
					</div>
				{/if}

				<div class="-space-y-px rounded-md shadow-sm">
					<div>
						<label for="name" class="sr-only">Name</label>
						<input
							id="name"
							name="name"
							type="text"
							autocomplete="name"
							bind:value={name}
							class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="Full name (optional)"
						/>
					</div>
					<div>
						<label for="email-address" class="sr-only">Email address</label>
						<input
							id="email-address"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="Email address"
						/>
					</div>
					<div>
						<label for="password" class="sr-only">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							bind:value={password}
							class="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="Password (min 8 characters)"
						/>
					</div>
					<div>
						<label for="confirm-password" class="sr-only">Confirm Password</label>
						<input
							id="confirm-password"
							name="confirm-password"
							type="password"
							autocomplete="new-password"
							required
							bind:value={confirmPassword}
							class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="Confirm password"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Creating account...' : 'Sign up'}
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
