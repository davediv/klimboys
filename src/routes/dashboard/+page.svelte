<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	async function handleLogout() {
		const response = await fetch('/api/auth/sign-out', {
			method: 'POST'
		});

		if (response.ok) {
			await goto('/');
		}
	}

	function getRoleBadgeColor(role: string) {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'cashier':
				return 'bg-yellow-100 text-yellow-800';
			case 'viewer':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getRolePermissions(role: string) {
		switch (role) {
			case 'admin':
				return [
					'Full system access',
					'Manage users and roles',
					'Create, edit, and delete content',
					'View all content and analytics',
					'System configuration'
				];
			case 'cashier':
				return ['Create transaction'];
			case 'viewer':
				return ['View inventory', 'View transactions'];
			default:
				return [];
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<h1 class="text-xl font-bold">Dashboard</h1>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/dashboard"
							class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
						>
							Dashboard
						</a>
						{#if data.user?.role === 'admin'}
							<a
								href="/admin"
								class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							>
								Admin Panel
							</a>
						{/if}
					</div>
				</div>
				<div class="flex items-center">
					<span class="mr-4 text-sm text-gray-700">
						{data.user?.email}
					</span>
					<button
						onclick={handleLogout}
						class="ml-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					>
						Sign out
					</button>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		{#if data.needsVerification}
			<!-- Email Verification Warning -->
			<div class="px-4 py-6 sm:px-0">
				<div class="rounded-md bg-yellow-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-800">Email verification required</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<p>
									Please verify your email address to access all features. Check your email for the
									verification link.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="px-4 py-6 sm:px-0">
			<!-- User Info Card -->
			<div class="overflow-hidden rounded-lg bg-white shadow">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-gray-900">
						Welcome, {data.user?.name || data.user?.email}!
					</h3>
					<div class="mt-5">
						<dl class="grid grid-cols-1 gap-5 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500">Email</dt>
								<dd class="mt-1 text-sm text-gray-900">{data.user?.email}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Role</dt>
								<dd class="mt-1">
									<span
										class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(data.user?.role || 'viewer')}`}
									>
										{data.user?.role?.toUpperCase()}
									</span>
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Email Verified</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{#if data.user?.emailVerified}
										<span class="text-green-600">✓ Verified</span>
									{:else}
										<span class="text-red-600">✗ Not Verified</span>
									{/if}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">Member Since</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{new Date(data.user?.createdAt || '').toLocaleDateString()}
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</div>

			<!-- Role Permissions Card -->
			<div class="mt-6 overflow-hidden rounded-lg bg-white shadow">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-gray-900">Your Permissions</h3>
					<p class="mt-1 text-sm text-gray-500">
						As a {data.user?.role}, you have the following permissions:
					</p>
					<ul class="mt-4 space-y-2">
						{#each getRolePermissions(data.user?.role || 'viewer') as permission (permission)}
							<li class="flex items-start">
								<svg
									class="h-5 w-5 flex-shrink-0 text-green-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
								<span class="ml-2 text-sm text-gray-700">{permission}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="mt-6">
				<h3 class="mb-4 text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#if data.user?.role === 'admin'}
						<button
							class="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
						>
							<div class="min-w-0 flex-1">
								<span class="absolute inset-0" aria-hidden="true"></span>
								<p class="text-sm font-medium text-gray-900">Manage Users</p>
								<p class="text-sm text-gray-500">Add, edit, or remove users</p>
							</div>
						</button>
						<button
							class="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
						>
							<div class="min-w-0 flex-1">
								<span class="absolute inset-0" aria-hidden="true"></span>
								<p class="text-sm font-medium text-gray-900">System Settings</p>
								<p class="text-sm text-gray-500">Configure system preferences</p>
							</div>
						</button>
					{/if}

					{#if data.user?.role === 'admin' || data.user?.role === 'cashier'}
						<button
							class="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
						>
							<div class="min-w-0 flex-1">
								<span class="absolute inset-0" aria-hidden="true"></span>
								<p class="text-sm font-medium text-gray-900">Create Content</p>
								<p class="text-sm text-gray-500">Add new articles or posts</p>
							</div>
						</button>
					{/if}

					<button
						class="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
					>
						<div class="min-w-0 flex-1">
							<span class="absolute inset-0" aria-hidden="true"></span>
							<p class="text-sm font-medium text-gray-900">View Content</p>
							<p class="text-sm text-gray-500">Browse available content</p>
						</div>
					</button>

					<button
						class="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
					>
						<div class="min-w-0 flex-1">
							<span class="absolute inset-0" aria-hidden="true"></span>
							<p class="text-sm font-medium text-gray-900">Profile Settings</p>
							<p class="text-sm text-gray-500">Update your profile information</p>
						</div>
					</button>
				</div>
			</div>
		</div>
	</main>
</div>
