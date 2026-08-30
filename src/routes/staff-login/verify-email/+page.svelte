<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import StaffAuthShell from '$lib/components/StaffAuthShell.svelte';
	import { alertStyles, buttonStyles, cx, inputStyles, spinnerStyles } from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let email = $state(data.email);
	let error = $state('');
	let sent = $state(false);
	let loading = $state(false);

	async function resendVerification(event: SubmitEvent) {
		event.preventDefault();
		if (!data.emailDeliveryAvailable || loading) return;

		error = '';
		loading = true;
		try {
			const response = await fetch('/api/auth/send-verification-email', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email: email.trim(),
					callbackURL: `${window.location.origin}/staff-login?verified=true`
				})
			});
			if (!response.ok) throw new Error('The verification email could not be sent.');
			sent = true;
		} catch (sendError) {
			error = sendError instanceof Error ? sendError.message : 'Verification email failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Verify Staff Email - Klimboys</title>
	<meta name="description" content="Verify an authorized Klimboys staff email address." />
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<StaffAuthShell
	title="Verify your email"
	description="Email verification is required for staff access."
>
	{#if !data.emailDeliveryAvailable}
		<div class={alertStyles('caution')} role="status">
			Verification delivery is not configured yet. Contact your administrator to verify the account.
		</div>
	{:else if sent}
		<div class={alertStyles('positive')} role="status">
			If the address belongs to an unverified staff account, a new verification link has been sent.
		</div>
	{:else}
		{#if error}<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{error}</div>{/if}
		<form onsubmit={resendVerification} class="space-y-5">
			<div>
				<label for="verification-email" class="mb-2 block text-sm font-medium text-gray-700">
					Staff email address
				</label>
				<div class="relative">
					<Mail
						class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
					/>
					<input
						id="verification-email"
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
				{loading ? 'Sending verification…' : 'Resend verification email'}
			</button>
		</form>
	{/if}
	<a href="/staff-login" class={cx(buttonStyles({ variant: 'ghost', block: true }), 'mt-5')}>
		Back to sign in
	</a>
</StaffAuthShell>
