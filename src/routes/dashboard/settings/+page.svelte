<script lang="ts">
	import { Bell, Globe, Save } from '@lucide/svelte';
	import { notify } from '$lib/utils/notifications';
	import Button from '$lib/components/Button.svelte';

	// Settings state
	let language = $state('en');

	let loading = $state(false);

	async function handleSave() {
		loading = true;

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Show success notification
			notify.updated('Settings');
		} catch (error) {
			// Show error notification if something goes wrong
			notify.error('Update Settings', 'Failed to save settings');
		} finally {
			loading = false;
		}
	}

	const languages = [
		{ value: 'en', label: 'English' },
		{ value: 'id', label: 'Indonesia' }
	];
</script>

<svelte:head>
	<title>Settings - Dashboard</title>
</svelte:head>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-base-content text-2xl font-bold">Settings</h1>
			<p class="text-base-content/70 mt-1">Manage your account preferences and security</p>
		</div>
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
		class="space-y-6"
	>
		<!-- Notifications -->
		<div class="card bg-base-100 border-base-300 border shadow-sm">
			<div class="card-body">
				<div class="mb-4 flex items-center space-x-3">
					<Bell class="text-primary h-5 w-5" />
					<h3 class="card-title text-lg">Notifications</h3>
				</div>
			</div>
		</div>

		<!-- Language & Region -->
		<div class="card bg-base-100 border-base-300 border shadow-sm">
			<div class="card-body">
				<div class="mb-4 flex items-center space-x-3">
					<Globe class="text-primary h-5 w-5" />
					<h3 class="card-title text-lg">Language & Region</h3>
				</div>

				<div class="space-y-4">
					<div class="form-control">
						<label class="label" for="language">
							<span class="label-text">Language</span>
						</label>
						<select
							id="language"
							bind:value={language}
							class="select select-bordered w-full max-w-xs"
						>
							{#each languages as lang (lang.value)}
								<option value={lang.value}>{lang.label}</option>
							{/each}
						</select>
						<div class="label">
							<span class="label-text-alt">Select your preferred language</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Save Button -->
		<div class="flex justify-end">
			<Button type="submit" variant="primary" {loading} loadingText="Saving..." icon={Save as any}
				>Save Settings</Button
			>
		</div>
	</form>
</div>
