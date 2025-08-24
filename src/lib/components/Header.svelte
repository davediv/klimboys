<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import {
		Menu,
		X,
		ShoppingBag,
		User,
		LogOut,
		Settings,
		LayoutDashboard,
		ShoppingCart
	} from '@lucide/svelte';

	interface Props {
		user?: {
			id: string;
			email: string;
			name?: string | null;
			role: string;
			emailVerified: boolean;
			image?: string | null;
			createdAt: Date;
			updatedAt: Date;
		} | null;
	}

	let { user = null }: Props = $props();

	let mobileMenuOpen = $state(false);

	// Dynamic nav items based on user role
	let navItems = $derived(() => {
		const items = [
			{ href: '/', label: 'Home', roles: ['viewer', 'cashier', 'admin'] },
			{ href: '/menu', label: 'Menu', roles: ['viewer', 'cashier', 'admin'] },
			{ href: '/about', label: 'About', roles: ['viewer', 'cashier', 'admin'] },
			{ href: '/contact', label: 'Contact', roles: ['viewer', 'cashier', 'admin'] }
		];

		// Add role-specific items
		if (user?.role === 'admin') {
			items.push(
				{ href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
				{ href: '/admin/products', label: 'Products', roles: ['admin'] }
			);
		} else if (user?.role === 'cashier') {
			items.push(
				{ href: '/transaction', label: 'POS', roles: ['cashier'] },
				{ href: '/dashboard', label: 'Dashboard', roles: ['cashier'] }
			);
		}

		return items.filter(
			(item) => !user || !item.roles || item.roles.includes(user.role || 'viewer')
		);
	});

	async function handleLogout() {
		await fetch('/api/auth/sign-out', { method: 'POST' });
		window.location.href = '/';
	}
</script>

<header class="sticky top-0 z-50 navbar border-b border-base-200 bg-base-100 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown lg:hidden">
			<button
				tabindex="0"
				class="btn btn-circle btn-ghost"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
			{#if mobileMenuOpen}
				<ul
					class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					{#each navItems() as item}
						<li>
							<a
								href={item.href}
								class="font-medium {$page.url.pathname === item.href ? 'active' : ''}"
								onclick={() => (mobileMenuOpen = false)}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<a href="/" class="flex items-center gap-2 px-2">
			<img src={Logo} alt="Klimboys Logo" class="h-8 w-auto sm:h-10" />
		</a>
	</div>

	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal gap-2 px-1">
			{#each navItems() as item}
				<li>
					<a
						href={item.href}
						class="font-medium {$page.url.pathname === item.href ? 'active text-primary' : ''}"
					>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="navbar-end">
		{#if user?.role === 'cashier' || user?.role === 'admin'}
			<button class="btn btn-circle btn-ghost" aria-label="Shopping cart">
				<ShoppingBag class="h-5 w-5" />
			</button>
		{/if}
		<div class="dropdown dropdown-end">
			<button tabindex="0" class="btn btn-circle btn-ghost" aria-label="User menu">
				<User class="h-5 w-5" />
			</button>
			<ul class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				{#if user}
					<li class="menu-title">
						<span>{user.name || user.email}</span>
						<span class="text-xs opacity-60">{user.role}</span>
					</li>
					{#if user.role === 'admin'}
						<li><a href="/dashboard"><LayoutDashboard class="h-4 w-4" /> Dashboard</a></li>
						<li><a href="/admin/products"><Settings class="h-4 w-4" /> Manage Products</a></li>
					{/if}
					{#if user.role === 'cashier'}
						<li><a href="/transaction"><ShoppingCart class="h-4 w-4" /> POS</a></li>
						<li><a href="/dashboard"><LayoutDashboard class="h-4 w-4" /> Dashboard</a></li>
					{/if}
					<li><a href="/profile"><User class="h-4 w-4" /> Profile</a></li>
					<div class="divider my-0"></div>
					<li>
						<button onclick={handleLogout} class="text-error">
							<LogOut class="h-4 w-4" /> Logout
						</button>
					</li>
				{:else}
					<li><a href="/login">Login</a></li>
					<li><a href="/register">Register</a></li>
				{/if}
			</ul>
		</div>
	</div>
</header>
