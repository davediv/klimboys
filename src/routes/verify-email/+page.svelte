<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let verifying = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			try {
				const response = await fetch('/api/auth/verify-email', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						token: data.token
					})
				});

				if (response.ok) {
					// Redirect to login with success message
					await goto('/login?verified=true');
				} else {
					const result = (await response.json()) as { message?: string };
					error = result?.message || 'Verification failed';
				}
			} catch {
				error = 'An error occurred during verification';
			} finally {
				verifying = false;
			}
		})();
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Email Verification</h2>
		</div>

		{#if verifying}
			<div class="text-center">
				<div
					class="inline-flex items-center px-4 py-2 text-sm leading-6 font-semibold text-indigo-600"
				>
					<svg
						class="mr-3 -ml-1 h-5 w-5 animate-spin text-indigo-600"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Verifying your email...
				</div>
			</div>
		{:else if error}
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
						<div class="mt-4">
							<a href="/login" class="text-sm font-medium text-red-600 hover:text-red-500">
								Go to login →
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
