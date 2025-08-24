<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<!-- Navigation -->
	<nav class="bg-white shadow-lg">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-indigo-600">AuthApp</h1>
				</div>
				<div class="flex items-center space-x-4">
					{#if data.user}
						<span class="text-gray-700">Welcome, {data.user.email}</span>
						<a
							href="/dashboard"
							class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							Dashboard
						</a>
					{:else}
						<a
							href="/login"
							class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
						>
							Sign In
						</a>
						<a
							href="/register"
							class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							Get Started
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<div class="relative overflow-hidden">
		<div class="mx-auto max-w-7xl">
			<div
				class="relative z-10 bg-gradient-to-br from-blue-50 to-indigo-100 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32"
			>
				<main
					class="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28"
				>
					<div class="sm:text-center lg:text-left">
						<h1
							class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
						>
							<span class="block xl:inline">Secure Authentication</span>
							<span class="block text-indigo-600 xl:inline"> Made Simple</span>
						</h1>
						<p
							class="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0"
						>
							A production-ready authentication system with role-based access control. Features
							email verification, secure sessions, and three user roles: Admin, Editor, and Viewer.
						</p>
						<div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
							{#if !data.user}
								<div class="rounded-md shadow">
									<a
										href="/register"
										class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 md:px-10 md:py-4 md:text-lg"
									>
										Create Account
									</a>
								</div>
								<div class="mt-3 sm:mt-0 sm:ml-3">
									<a
										href="/login"
										class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-100 px-8 py-3 text-base font-medium text-indigo-700 hover:bg-indigo-200 md:px-10 md:py-4 md:text-lg"
									>
										Sign In
									</a>
								</div>
							{:else}
								<div class="rounded-md shadow">
									<a
										href="/dashboard"
										class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 md:px-10 md:py-4 md:text-lg"
									>
										Go to Dashboard
									</a>
								</div>
							{/if}
						</div>
					</div>
				</main>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="bg-white py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="lg:text-center">
				<h2 class="text-base font-semibold tracking-wide text-indigo-600 uppercase">Features</h2>
				<p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
					Everything you need for authentication
				</p>
			</div>

			<div class="mt-10">
				<dl class="space-y-10 md:grid md:grid-cols-2 md:space-y-0 md:gap-x-8 md:gap-y-10">
					<div class="relative">
						<dt>
							<div
								class="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white"
							>
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<p class="ml-16 text-lg leading-6 font-medium text-gray-900">Email Verification</p>
						</dt>
						<dd class="mt-2 ml-16 text-base text-gray-500">
							Users must verify their email address before accessing the application, ensuring
							authentic user accounts.
						</dd>
					</div>

					<div class="relative">
						<dt>
							<div
								class="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white"
							>
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<p class="ml-16 text-lg leading-6 font-medium text-gray-900">Secure Sessions</p>
						</dt>
						<dd class="mt-2 ml-16 text-base text-gray-500">
							Sessions are securely managed with automatic expiration and renewal for optimal
							security.
						</dd>
					</div>

					<div class="relative">
						<dt>
							<div
								class="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white"
							>
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<p class="ml-16 text-lg leading-6 font-medium text-gray-900">Role-Based Access</p>
						</dt>
						<dd class="mt-2 ml-16 text-base text-gray-500">
							Three distinct roles (Admin, Editor, Viewer) with different permission levels for
							fine-grained access control.
						</dd>
					</div>

					<div class="relative">
						<dt>
							<div
								class="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white"
							>
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<p class="ml-16 text-lg leading-6 font-medium text-gray-900">Production Ready</p>
						</dt>
						<dd class="mt-2 ml-16 text-base text-gray-500">
							Built with Better Auth, Drizzle ORM, and Cloudflare Workers for scalable, secure
							authentication.
						</dd>
					</div>
				</dl>
			</div>
		</div>
	</div>

	<!-- Role Description Section -->
	<div class="bg-gray-50 py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-10 lg:text-center">
				<h2 class="text-base font-semibold tracking-wide text-indigo-600 uppercase">User Roles</h2>
				<p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
					Three levels of access
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-red-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<div class="ml-5">
								<h3 class="text-lg font-medium text-gray-900">Admin</h3>
								<p class="text-sm text-gray-500">Full system control</p>
							</div>
						</div>
						<div class="mt-5">
							<ul class="space-y-2 text-sm text-gray-600">
								<li>• Manage all users</li>
								<li>• System configuration</li>
								<li>• Full content control</li>
								<li>• Access analytics</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-yellow-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</div>
							<div class="ml-5">
								<h3 class="text-lg font-medium text-gray-900">Editor</h3>
								<p class="text-sm text-gray-500">Content management</p>
							</div>
						</div>
						<div class="mt-5">
							<ul class="space-y-2 text-sm text-gray-600">
								<li>• Create content</li>
								<li>• Edit content</li>
								<li>• Publish articles</li>
								<li>• View analytics</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-green-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							</div>
							<div class="ml-5">
								<h3 class="text-lg font-medium text-gray-900">Viewer</h3>
								<p class="text-sm text-gray-500">Read-only access</p>
							</div>
						</div>
						<div class="mt-5">
							<ul class="space-y-2 text-sm text-gray-600">
								<li>• View content</li>
								<li>• Read articles</li>
								<li>• View own profile</li>
								<li>• Basic access</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
