<script lang="ts">
	import {
		ClipboardList,
		Boxes,
		LayoutDashboard,
		ShoppingCart,
		Package,
		Menu,
		X,
		LogOut,
		Store
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import { focusTrap } from '$lib/actions/focus-trap';
	import { getStaffNavigation, type StaffRouteId } from '$lib/navigation';
	import { getDefaultStaffPath } from '$lib/permissions';
	import { buttonStyles, cx } from '$lib/styles';
	import type { Snippet } from 'svelte';

	interface Props {
		user: App.Locals['user'] | null;
		children?: Snippet;
		title?: string;
	}

	let { user, children, title = 'Staff Workspace' }: Props = $props();
	let sidebarOpen = $state(false);
	let isDesktop = $state(false);
	let viewportReady = $state(false);
	let staffLandingPath = $derived(getDefaultStaffPath(user?.role));

	const routeIcons = {
		overview: LayoutDashboard,
		pos: ShoppingCart,
		orders: ClipboardList,
		inventory: Boxes,
		catalog: Package
	} satisfies Record<StaffRouteId, typeof LayoutDashboard>;

	let sidebarItems = $derived(
		getStaffNavigation(user?.role).map((route) => ({
			...route,
			icon: routeIcons[route.id as StaffRouteId]
		}))
	);
	let sidebarGroups = $derived(
		(['Operations', 'Management'] as const)
			.map((section) => ({
				section,
				items: sidebarItems.filter((item) => item.section === section)
			}))
			.filter((group) => group.items.length > 0)
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
		return currentPath.startsWith(href);
	}

	$effect(() => {
		const media = window.matchMedia('(min-width: 1024px)');
		const updateViewport = () => {
			isDesktop = media.matches;
			viewportReady = true;
		};
		updateViewport();
		media.addEventListener('change', updateViewport);
		return () => media.removeEventListener('change', updateViewport);
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && sidebarOpen && !isDesktop) sidebarOpen = false;
	}}
/>

<a
	href="#staff-main-content"
	class="sr-only z-[1000] rounded bg-white px-4 py-2 text-ink shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
>
	Skip to main content
</a>

<div class="flex h-screen bg-surface-muted">
	<!-- Sidebar -->
	<aside
		id="staff-navigation"
		class={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
		inert={viewportReady && !isDesktop && !sidebarOpen}
		aria-hidden={viewportReady && !isDesktop && !sidebarOpen ? 'true' : undefined}
		role={viewportReady && !isDesktop && sidebarOpen ? 'dialog' : undefined}
		aria-modal={viewportReady && !isDesktop && sidebarOpen ? 'true' : undefined}
		aria-label={viewportReady && !isDesktop && sidebarOpen ? 'Staff navigation' : undefined}
		tabindex="-1"
		use:focusTrap={viewportReady && sidebarOpen && !isDesktop}
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
					type="button"
					onclick={() => (sidebarOpen = false)}
					class="lg:hidden"
					aria-label="Close staff navigation"
					data-autofocus
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Staff navigation">
				{#each sidebarGroups as group (group.section)}
					<div class="mb-5">
						<p class="px-3 pb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
							{group.section}
						</p>
						<div class="space-y-1">
							{#each group.items as item (item.id)}
								{@const ItemIcon = item.icon}
								<a
									href={item.href}
									aria-current={isActive(item.href) ? 'page' : undefined}
									onclick={() => (sidebarOpen = false)}
									class={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
										isActive(item.href)
											? 'bg-[#FF6B6B] text-white'
											: 'text-gray-700 hover:bg-gray-100'
									}`}
								>
									<ItemIcon class="h-5 w-5" />
									{item.label}
								</a>
							{/each}
						</div>
					</div>
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
	<div
		class="flex flex-1 flex-col overflow-hidden"
		inert={viewportReady && !isDesktop && sidebarOpen}
	>
		<!-- Header -->
		<header class="border-b border-gray-200 bg-white shadow-sm">
			<div class="flex h-16 items-center justify-between px-6">
				<div class="flex items-center gap-4">
					<button
						type="button"
						onclick={() => (sidebarOpen = !sidebarOpen)}
						class="lg:hidden"
						aria-label={sidebarOpen ? 'Close staff navigation' : 'Open staff navigation'}
						aria-expanded={sidebarOpen}
						aria-controls="staff-navigation"
					>
						<Menu class="h-6 w-6" />
					</button>
					<h2 class="text-xl font-semibold text-gray-800">{title}</h2>
				</div>

				<div></div>
			</div>
		</header>

		<!-- Main Content Area -->
		<main id="staff-main-content" tabindex="-1" class="flex-1 overflow-y-auto bg-gray-50 p-6">
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
		type="button"
		class="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
		onclick={() => (sidebarOpen = false)}
		aria-hidden="true"
		tabindex="-1"
	></button>
{/if}
