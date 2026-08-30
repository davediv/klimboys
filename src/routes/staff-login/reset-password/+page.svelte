<script lang="ts">
	import { goto } from '$app/navigation';
	import { Lock } from '@lucide/svelte';
	import StaffAuthShell from '$lib/components/StaffAuthShell.svelte';
	import { alertStyles, buttonStyles, cx, inputStyles, spinnerStyles } from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let password = $state('');
	let confirmation = $state('');
	let error = $state('');
	let loading = $state(false);

	async function resetPassword(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		if (password.length < 8) {
			error = 'Password must contain at least 8 characters.';
			return;
		}
		if (password !== confirmation) {
			error = 'Passwords do not match.';
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ newPassword: password, token: data.token })
			});
			if (!response.ok) throw new Error('This reset link is invalid or has expired.');
			await goto('/staff-login?notice=password-reset', { replaceState: true });
		} catch (resetError) {
			error = resetError instanceof Error ? resetError.message : 'Password reset failed.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Choose New Staff Password - Klimboys</title>
	<meta name="description" content="Choose a new password for a Klimboys staff account." />
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<StaffAuthShell
	title="Choose a new password"
	description="Use a unique password for your staff account."
>
	{#if data.invalidToken}
		<div class={alertStyles('danger')} role="alert">
			This reset link is invalid or has expired. Request a new link to continue.
		</div>
		<a
			href="/staff-login/forgot-password"
			class={cx(buttonStyles({ tone: 'brand', block: true }), 'mt-6')}
		>
			Request another link
		</a>
	{:else}
		{#if error}<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{error}</div>{/if}
		<form onsubmit={resetPassword} class="space-y-5">
			<div>
				<label for="new-password" class="mb-2 block text-sm font-medium text-gray-700">
					New password
				</label>
				<div class="relative">
					<Lock
						class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
					/>
					<input
						id="new-password"
						name="new-password"
						type="password"
						autocomplete="new-password"
						minlength="8"
						maxlength="128"
						required
						bind:value={password}
						disabled={loading}
						class={cx(inputStyles({ full: true }), 'pl-10')}
					/>
				</div>
			</div>
			<div>
				<label for="confirm-password" class="mb-2 block text-sm font-medium text-gray-700">
					Confirm new password
				</label>
				<input
					id="confirm-password"
					name="confirm-password"
					type="password"
					autocomplete="new-password"
					minlength="8"
					maxlength="128"
					required
					bind:value={confirmation}
					disabled={loading}
					class={inputStyles({ full: true })}
				/>
			</div>
			<button
				type="submit"
				disabled={loading}
				class={buttonStyles({ tone: 'brand', size: 'lg', block: true })}
			>
				{#if loading}<span class={spinnerStyles('sm')}></span>{/if}
				{loading ? 'Updating password…' : 'Update password'}
			</button>
		</form>
	{/if}
</StaffAuthShell>
