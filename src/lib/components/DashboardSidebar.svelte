<script lang="ts">
	import { page } from '$app/stores';
	import {
		Home,
		Settings,
		Users,
		Shield,
		Package,
		ShoppingCart,
		ChartBar,
		BookOpen,
		Tag
	} from '@lucide/svelte';

	let {
		mobile = false,
		onlinkclick = () => {},
		session
	}: {
		mobile?: boolean;
		onlinkclick?: () => void;
		session?: App.PageData['session'];
	} = $props();

	const isAdmin = session?.user?.role === 'admin';

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

<aside class="bg-base-100 min-h-screen w-64 {mobile ? 'block' : 'hidden lg:block'}">
	<div class="p-4">
		<div class="mb-6 flex items-center justify-center">
			<img src="/logo.svg" alt="Logo" class="h-auto w-full" />
		</div>

		<nav>
			<ul class="space-y-2">
				{#each menuItems as item (item.label)}
					{@const Icon = item.icon}
					<li>
						<a
							href={item.href}
							onclick={onlinkclick}
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
