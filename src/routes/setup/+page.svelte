<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import { Shield, UserPlus } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { goto } from '$app/navigation';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = $state(false);
</script>

<svelte:head>
	<title>Setup Admin Account - Klimboys</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md p-8">
		<div class="bg-base-100 rounded-box p-8 shadow-xl">
			<!-- Logo/Title -->
			<div class="mb-8 text-center">
				<div
					class="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full"
				>
					<Shield class="text-primary h-8 w-8" />
				</div>
				<h1 class="text-3xl font-bold">Welcome to Klimboys</h1>
				<p class="text-base-content/70 mt-2">Let's create your admin account</p>
			</div>

			<!-- Setup Form -->
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Admin account created!', 'Welcome to Klimboys POS');
							await update();
							goto('/dashboard');
						} else if (result.type === 'failure') {
							await update();
						}
					};
				}}
			>
				<div class="space-y-4">
					<!-- Name Input -->
					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text">Full Name</span>
						</label>
						<input
							id="name"
							name="name"
							type="text"
							placeholder="John Doe"
							class="input input-bordered {form?.errors?.name ? 'input-error' : ''}"
							value={form?.data?.name ?? ''}
							required
						/>
						{#if form?.errors?.name}
							<label class="label">
								<span class="label-text-alt text-error">{form.errors.name[0]}</span>
							</label>
						{/if}
					</div>

					<!-- Email Input -->
					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text">Email Address</span>
						</label>
						<input
							id="email"
							name="email"
							type="email"
							placeholder="admin@klimboys.com"
							class="input input-bordered {form?.errors?.email ? 'input-error' : ''}"
							value={form?.data?.email ?? ''}
							required
						/>
						{#if form?.errors?.email}
							<label class="label">
								<span class="label-text-alt text-error">{form.errors.email[0]}</span>
							</label>
						{/if}
					</div>

					<!-- Password Input -->
					<div class="form-control">
						<label class="label" for="password">
							<span class="label-text">Password</span>
						</label>
						<input
							id="password"
							name="password"
							type="password"
							placeholder="••••••••"
							class="input input-bordered {form?.errors?.password ? 'input-error' : ''}"
							required
							minlength="8"
						/>
						{#if form?.errors?.password}
							<label class="label">
								<span class="label-text-alt text-error">{form.errors.password[0]}</span>
							</label>
						{/if}
						<label class="label">
							<span class="label-text-alt">Minimum 8 characters</span>
						</label>
					</div>

					{#if form?.message}
						<div class="alert alert-error">
							<span>{form.message}</span>
						</div>
					{/if}

					<!-- Submit Button -->
					<Button
						type="submit"
						variant="primary"
						block
						{loading}
						loadingText="Creating account..."
						icon={UserPlus}
					>
						Create Admin Account
					</Button>
				</div>
			</form>

			<!-- Info -->
			<div class="bg-info/10 mt-6 rounded-lg p-4">
				<p class="text-info-content text-sm">
					<strong>Note:</strong> This setup page is only available when no users exist in the system.
					The account you create here will have full administrative privileges.
				</p>
			</div>
		</div>
	</div>
</div>
