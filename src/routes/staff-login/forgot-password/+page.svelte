<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import StaffAuthShell from '$lib/components/StaffAuthShell.svelte';
	import { alertStyles, buttonStyles, cx, inputStyles, spinnerStyles } from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let email = $state('');
	let error = $state('');
	let submitted = $state(false);
	let loading = $state(false);

	async function requestReset(event: SubmitEvent) {
		event.preventDefault();
		if (!data.emailRecoveryAvailable || loading) return;

		error = '';
		loading = true;
		try {
			const response = await fetch('/api/auth/request-password-reset', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: email.trim(),
					redirectTo: `${window.location.origin}/staff-login/reset-password`
				})
			});

			if (!response.ok) {
				throw new Error('Password recovery email is temporarily unavailable.');
			}
			submitted = true;
		} catch (requestError) {
			error = requestError instanceof Error ? requestError.message : 'Password recovery failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Staff Password - Klimboys</title>
	<meta name="description" content="Request a secure Klimboys staff password reset." />
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<StaffAuthShell
	title="Forgot password?"
	description="Request a secure reset link for your staff account."
>
	{#if !data.emailRecoveryAvailable}
		<div class={alertStyles('caution')} role="status">
			Email recovery is not configured yet. Contact your administrator to regain access.
		</div>
		<a href="/staff-login" class={cx(buttonStyles({ variant: 'outline', block: true }), 'mt-6')}>
			Back to sign in
		</a>
	{:else if submitted}
		<div class={alertStyles('positive')} role="status">
			If that address belongs to a staff account, a reset link has been sent.
		</div>
		<a href="/staff-login" class={cx(buttonStyles({ variant: 'outline', block: true }), 'mt-6')}>
			Back to sign in
		</a>
	{:else}
		{#if error}
			<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{error}</div>
		{/if}
		<form onsubmit={requestReset} class="space-y-5">
			<div>
				<label for="recovery-email" class="mb-2 block text-sm font-medium text-gray-700">
					Email address
				</label>
				<div class="relative">
					<Mail
						class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
					/>
					<input
						id="recovery-email"
						name="email"
						type="email"
						autocomplete="email"
						required
						bind:value={email}
						disabled={loading}
						class={cx(inputStyles({ full: true }), 'pl-10')}
					/>
				</div>
			</div>
			<button
				type="submit"
				disabled={loading}
				class={buttonStyles({ tone: 'brand', size: 'lg', block: true })}
			>
				{#if loading}<span class={spinnerStyles('sm')}></span>{/if}
				{loading ? 'Sending reset link…' : 'Send reset link'}
			</button>
			<a href="/staff-login" class={buttonStyles({ variant: 'ghost', block: true })}>
				Back to sign in
			</a>
		</form>
	{/if}
</StaffAuthShell>
