<script lang="ts">
	import { page } from '$app/stores';
	import {
		Home,
		Settings,
		X,
		Users,
		Shield,
		Package,
		ShoppingCart,
		ChartBar,
		BookOpen,
		Tag
	} from '@lucide/svelte';

	let {
		isOpen = false,
		onclose = () => {},
		session
	}: {
		isOpen?: boolean;
		onclose?: () => void;
		session?: App.PageData['session'];
	} = $props();

	const menuItems = [
		{
			icon: Home,
			label: 'Dashboard',
			href: '/dashboard',
			description: 'Overview and statistics',
			roles: ['admin', 'cashier']
		},
		{
			icon: ShoppingCart,
			label: 'Transactions',
			href: '/dashboard/transactions',
			description: 'Create and view transactions',
			roles: ['admin', 'cashier']
		},
		{
			icon: Package,
			label: 'Products',
			href: '/dashboard/products',
			description: 'Manage products',
			roles: ['admin', 'cashier']
		},
		{
			icon: Tag,
			label: 'Categories',
			href: '/dashboard/categories',
			description: 'Product categories',
			roles: ['admin']
		},
		// Admin only sections
		{
			icon: BookOpen,
			label: 'Inventory',
			href: '/dashboard/inventory',
			description: 'Stock management',
			roles: ['admin']
		},
		{
			icon: Users,
			label: 'Customers',
			href: '/dashboard/customers',
			description: 'Customer management',
			roles: ['admin']
		},
		{
			icon: ChartBar,
			label: 'Analytics',
			href: '/dashboard/analytics',
			description: 'Reports and insights',
			roles: ['admin']
		},
		{
			icon: Shield,
			label: 'Admin',
			href: '/dashboard/admin/users',
			description: 'System administration',
			roles: ['admin']
		},
		{
			icon: Settings,
			label: 'Settings',
			href: '/dashboard/settings',
			description: 'Account settings',
			roles: ['admin', 'cashier']
		}
	].filter((item) => {
		// Filter menu items based on user role
		if (!session?.user?.role) return false;
		return item.roles.includes(session.user.role);
	});
</script>

<div class="lg:hidden">
	<!-- Backdrop -->
	{#if isOpen}
		<button class="fixed inset-0 z-40 bg-black/50" onclick={onclose} aria-label="Close menu"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="bg-base-100 fixed top-0 left-0 z-50 h-full w-64 transform transition-transform {isOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="p-4">
			<div class="mb-6 flex items-center justify-between">
				<img src="/logo.svg" alt="Logo" class="h-10 w-auto" />
				<button class="btn btn-sm btn-ghost btn-circle" onclick={onclose}>
					<X class="h-5 w-5" />
				</button>
			</div>

			<nav>
				<ul class="space-y-2">
					{#each menuItems as item (item.label)}
						{@const Icon = item.icon}
						<li>
							<a
								href={item.href}
								onclick={onclose}
								class="flex items-center gap-3 rounded-lg p-3 transition-colors {$page.url
									.pathname === item.href
									? 'bg-primary text-primary-content hover:bg-primary/90'
									: 'hover:bg-base-300'}"
							>
								<Icon class="h-5 w-5" />
								<div class="flex-1">
									<span class="font-medium">{item.label}</span>
									<span class="block text-xs opacity-70">{item.description}</span>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</aside>
</div>
