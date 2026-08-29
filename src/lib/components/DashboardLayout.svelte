<script lang="ts">
	import {
		LayoutDashboard,
		ShoppingCart,
		Package,
		Users,
		Bell,
		Menu,
		X,
		Settings,
		LogOut,
		FileText,
		BarChart3
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import { badgeStyles, buttonStyles, cx } from '$lib/styles';

	interface Props {
		user: any;
		children?: any;
		title?: string;
	}

	let { user, children, title = 'Dashboard' }: Props = $props();
	let sidebarOpen = $state(false);

	const sidebarItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
		{ icon: ShoppingCart, label: 'Transactions', href: '/dashboard/transaction' },
		{ icon: Package, label: 'Products', href: '/dashboard/products' },
		{ icon: FileText, label: 'Reports', href: '/dashboard/reports' },
		{ icon: Users, label: 'Users', href: '/dashboard/users', adminOnly: true },
		{ icon: Settings, label: 'Settings', href: '/dashboard/settings' }
	];

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
				<img src={Logo} alt="Klimboys" class="h-auto w-full pr-4" />
				<button onclick={() => (sidebarOpen = false)} class="lg:hidden">
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 space-y-1 px-3 py-4">
				{#each sidebarItems as item}
					{#if !item.adminOnly || user?.role === 'admin'}
						<a
							href={item.href}
							class={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
								isActive(item.href) ? 'bg-[#FF6B6B] text-white' : 'text-gray-700 hover:bg-gray-100'
							}`}
						>
							<svelte:component this={item.icon} class="h-5 w-5" />
							{item.label}
						</a>
					{/if}
				{/each}
			</nav>

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
					<button onclick={() => (sidebarOpen = !sidebarOpen)} class="lg:hidden">
						<Menu class="h-6 w-6" />
					</button>
					<h2 class="text-xl font-semibold text-gray-800">{title}</h2>
				</div>

				<div class="flex items-center gap-4">
					<!-- Notifications -->
					<button class={buttonStyles({ variant: 'ghost', size: 'sm', shape: 'circle' })}>
						<div class="relative inline-flex w-max">
							<Bell class="h-5 w-5" />
							<span
								class={cx(
									badgeStyles('danger', 'xs'),
									'absolute top-0 right-0 z-10 translate-x-1/2 -translate-y-1/2 whitespace-nowrap'
								)}>3</span
							>
						</div>
					</button>

					<!-- Settings -->
					<button class={buttonStyles({ variant: 'ghost', size: 'sm', shape: 'circle' })}>
						<Settings class="h-5 w-5" />
					</button>
				</div>
			</div>
		</header>

		<!-- Main Content Area -->
		<main class="flex-1 overflow-y-auto bg-gray-50 p-6">
			{@render children?.()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-gray-200 bg-white py-4">
			<div class="text-center text-sm text-gray-600">
				© {new Date().getFullYear()} Klimboys. All rights reserved.
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
