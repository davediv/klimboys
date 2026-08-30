<script lang="ts">
	import { LayoutDashboard, ShoppingCart, Package, Menu, X, LogOut, Store } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import { getStaffNavigation, type StaffRouteId } from '$lib/navigation';
	import { getDefaultStaffPath } from '$lib/permissions';
	import { buttonStyles, cx } from '$lib/styles';
	import type { Snippet } from 'svelte';

	interface Props {
		user: App.Locals['user'] | null;
		children?: Snippet;
		title?: string;
	}

	let { user, children, title = 'Dashboard' }: Props = $props();
	let sidebarOpen = $state(false);
	let staffLandingPath = $derived(getDefaultStaffPath(user?.role));

	const routeIcons = {
		dashboard: LayoutDashboard,
		pos: ShoppingCart,
		products: Package
	} satisfies Record<StaffRouteId, typeof LayoutDashboard>;

	let sidebarItems = $derived(
		getStaffNavigation(user?.role).map((route) => ({
			...route,
			icon: routeIcons[route.id as StaffRouteId]
		}))
	);

	async function handleLogout() {
		const response = await fetch('/api/auth/sign-out', {
			method: 'POST'
		});

		if (response.ok) {
			await goto('/');
		}
	}

	function isActive(href: string): boolean {
		const currentPath = $page.url.pathname;
		if (href === '/dashboard') {
			return currentPath === '/dashboard';
		}
		return currentPath.startsWith(href);
	}
</script>

<div class="flex h-screen bg-surface-muted">
	<!-- Sidebar -->
	<aside
		class={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
	>
		<div class="flex h-full flex-col">
			<!-- Logo -->
			<div class="flex h-20 items-center justify-between px-6">
				<a href={staffLandingPath} class="min-w-0 pr-4">
					<img src={Logo} alt="Klimboys staff workspace" class="h-10 w-auto" />
					<span class="mt-1 block text-xs font-semibold tracking-wide text-gray-500 uppercase">
						Staff workspace
					</span>
				</a>
				<button
					onclick={() => (sidebarOpen = false)}
					class="lg:hidden"
					aria-label="Close staff navigation"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 space-y-1 px-3 py-4" aria-label="Staff navigation">
				{#each sidebarItems as item (item.id)}
					{@const ItemIcon = item.icon}
					<a
						href={item.href}
						class={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
							isActive(item.href) ? 'bg-[#FF6B6B] text-white' : 'text-gray-700 hover:bg-gray-100'
						}`}
					>
						<ItemIcon class="h-5 w-5" />
						{item.label}
					</a>
				{/each}
			</nav>

			<a
				href="/"
				class="mx-3 mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
			>
				<Store class="h-5 w-5" />
				View public website
			</a>

			<!-- User section -->
			<div class="border-t border-gray-200 p-4">
				<div class="mb-3 flex items-center gap-3">
					<div class="relative inline-flex align-middle">
						<div class="aspect-square w-10 overflow-hidden rounded-full bg-[#FF6B6B] text-white">
							<span class="flex h-full items-center justify-center text-sm font-medium">
								{user?.email?.charAt(0).toUpperCase()}
							</span>
						</div>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
						<p class="text-xs text-gray-500 capitalize">{user?.role}</p>
					</div>
				</div>
				<button
					onclick={handleLogout}
					class={cx(
						buttonStyles({ variant: 'ghost', size: 'sm', block: true }),
						'justify-start gap-2'
					)}
				>
					<LogOut class="h-4 w-4" />
					Sign Out
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<header class="border-b border-gray-200 bg-white shadow-sm">
			<div class="flex h-16 items-center justify-between px-6">
				<div class="flex items-center gap-4">
					<button
						onclick={() => (sidebarOpen = !sidebarOpen)}
						class="lg:hidden"
						aria-label="Open staff navigation"
					>
						<Menu class="h-6 w-6" />
					</button>
					<h2 class="text-xl font-semibold text-gray-800">{title}</h2>
				</div>

				<div></div>
			</div>
		</header>

		<!-- Main Content Area -->
		<main class="flex-1 overflow-y-auto bg-gray-50 p-6">
			{@render children?.()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-gray-200 bg-white py-4">
			<div class="text-center text-sm text-gray-600">
				© {new Date().getFullYear()} Klimboys Staff Workspace
			</div>
		</footer>
	</div>
</div>

<!-- Mobile Sidebar Overlay -->
{#if sidebarOpen}
	<button
		class="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
		onclick={() => (sidebarOpen = false)}
		aria-label="Close sidebar"
	></button>
{/if}
