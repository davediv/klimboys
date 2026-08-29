<script lang="ts">
	import {
		DollarSign,
		ShoppingCart,
		Package,
		AlertCircle,
		ChevronRight,
		Activity,
		Coffee,
		Users
	} from '@lucide/svelte';
	import type { PageData } from './$types';
	import {
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		compactTableStyles,
		cx
	} from '$lib/styles';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Mock data for dashboard stats
	const stats = [
		{
			label: "Today's Revenue",
			value: 'Rp 2,450,000',
			change: '+12%',
			trend: 'up',
			icon: DollarSign,
			color: 'text-green-600 bg-green-100'
		},
		{
			label: 'Total Orders',
			value: '48',
			change: '+8%',
			trend: 'up',
			icon: ShoppingCart,
			color: 'text-blue-600 bg-blue-100'
		},
		{
			label: 'Active Products',
			value: '24',
			change: '0%',
			trend: 'neutral',
			icon: Package,
			color: 'text-purple-600 bg-purple-100'
		},
		{
			label: 'Low Stock Items',
			value: '3',
			change: '-2',
			trend: 'down',
			icon: AlertCircle,
			color: 'text-orange-600 bg-orange-100'
		}
	];

	const recentOrders = [
		{
			id: 'TRX-20250124-0001',
			time: '5 mins ago',
			amount: 'Rp 85,000',
			status: 'completed',
			items: 3
		},
		{
			id: 'TRX-20250124-0002',
			time: '12 mins ago',
			amount: 'Rp 120,000',
			status: 'completed',
			items: 4
		},
		{
			id: 'TRX-20250124-0003',
			time: '25 mins ago',
			amount: 'Rp 45,000',
			status: 'pending',
			items: 2
		},
		{
			id: 'TRX-20250124-0004',
			time: '1 hour ago',
			amount: 'Rp 200,000',
			status: 'completed',
			items: 7
		},
		{
			id: 'TRX-20250124-0005',
			time: '2 hours ago',
			amount: 'Rp 95,000',
			status: 'completed',
			items: 3
		}
	];

	const lowStockItems = [
		{ name: 'Chocolate Shake (L)', stock: 5, minStock: 10 },
		{ name: 'Vanilla Dream (M)', stock: 3, minStock: 8 },
		{ name: 'Oreo Blast (S)', stock: 2, minStock: 5 }
	];

	const quickActions: Record<
		string,
		Array<{ icon: any; label: string; href: string; color: string }>
	> = {
		admin: [
			{
				icon: ShoppingCart,
				label: 'New Transaction',
				href: '/dashboard/transaction',
				color: 'bg-[#FF6B6B] text-white'
			},
			{
				icon: Package,
				label: 'Manage Products',
				href: '/dashboard/products',
				color: 'bg-blue-600 text-white'
			},
			{
				icon: Users,
				label: 'User Management',
				href: '/dashboard/users',
				color: 'bg-purple-600 text-white'
			},
			{
				icon: Activity,
				label: 'View Reports',
				href: '/dashboard/reports',
				color: 'bg-green-600 text-white'
			}
		],
		cashier: [
			{
				icon: ShoppingCart,
				label: 'New Transaction',
				href: '/dashboard/transaction',
				color: 'bg-[#FF6B6B] text-white'
			},
			{
				icon: Activity,
				label: 'Transaction History',
				href: '/dashboard/transactions',
				color: 'bg-blue-600 text-white'
			},
			{
				icon: Package,
				label: 'View Products',
				href: '/dashboard/products',
				color: 'bg-purple-600 text-white'
			},
			{
				icon: Activity,
				label: 'My Shift Report',
				href: '/dashboard/shift-report',
				color: 'bg-green-600 text-white'
			}
		]
	};

	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return badgeStyles('positive', 'sm');
			case 'pending':
				return badgeStyles('caution', 'sm');
			case 'cancelled':
				return badgeStyles('danger', 'sm');
			default:
				return badgeStyles('ghost', 'sm');
		}
	}
</script>

<!-- Welcome Section -->
<div class="mb-6">
	<h1 class="text-2xl font-bold text-gray-900">
		Welcome back, {data.user?.name || data.user?.email?.split('@')[0]}! 👋
	</h1>
	<p class="mt-1 text-gray-600">Here's what's happening with your store today.</p>
</div>

<!-- Stats Grid -->
<div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
	{#each stats as stat}
		<div class={cx(cardStyles, 'bg-white shadow-sm')}>
			<div class={cardBodyStyles}>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">{stat.label}</p>
						<p class="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
						<div class="mt-2 flex items-center gap-1">
							<span
								class={`text-xs font-medium ${
									stat.trend === 'up'
										? 'text-green-600'
										: stat.trend === 'down'
											? 'text-red-600'
											: 'text-gray-600'
								}`}
							>
								{stat.change} from yesterday
							</span>
						</div>
					</div>
					<div class={`rounded-lg p-3 ${stat.color}`}>
						<svelte:component this={stat.icon} class="h-6 w-6" />
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<!-- Quick Actions -->
<div class="mb-6">
	<h2 class="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each quickActions[data.user?.role || 'cashier'] || quickActions.cashier as action}
			<a
				href={action.href}
				class={cx(cardStyles, action.color, 'shadow-sm transition-shadow hover:shadow-md')}
			>
				<div class={cx(cardBodyStyles, 'items-center p-4 text-center')}>
					<svelte:component this={action.icon} class="mb-2 h-8 w-8" />
					<p class="text-sm font-medium">{action.label}</p>
				</div>
			</a>
		{/each}
	</div>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Recent Orders -->
	<div class="lg:col-span-2">
		<div class={cx(cardStyles, 'bg-white shadow-sm')}>
			<div class={cardBodyStyles}>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">Recent Transactions</h3>
					<a
						href="/dashboard/transactions"
						class={cx(buttonStyles({ variant: 'ghost', size: 'sm' }), 'gap-1')}
					>
						View All
						<ChevronRight class="h-4 w-4" />
					</a>
				</div>
				<div class="overflow-x-auto">
					<table class={compactTableStyles}>
						<thead>
							<tr>
								<th>Transaction ID</th>
								<th>Time</th>
								<th>Items</th>
								<th>Amount</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{#each recentOrders as order}
								<tr class="transition-colors hover:bg-surface-muted">
									<td class="font-medium">{order.id}</td>
									<td class="text-gray-600">{order.time}</td>
									<td>{order.items}</td>
									<td class="font-semibold">{order.amount}</td>
									<td>
										<span class={getStatusBadge(order.status)}>
											{order.status}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>

	<!-- Side Panel -->
	<div class="space-y-6">
		<!-- Low Stock Alert -->
		<div class={cx(cardStyles, 'bg-white shadow-sm')}>
			<div class={cardBodyStyles}>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
					<span class={badgeStyles('caution', 'sm')}>{lowStockItems.length} items</span>
				</div>
				<div class="space-y-3">
					{#each lowStockItems as item}
						<div class="flex items-center justify-between rounded-lg bg-orange-50 p-3">
							<div>
								<p class="text-sm font-medium text-gray-900">{item.name}</p>
								<p class="text-xs text-gray-600">Min stock: {item.minStock}</p>
							</div>
							<span class={badgeStyles('danger')}>{item.stock} left</span>
						</div>
					{/each}
				</div>
				<button
					class={cx(
						buttonStyles({ variant: 'outline', tone: 'caution', size: 'sm', block: true }),
						'mt-4'
					)}>Manage Inventory</button
				>
			</div>
		</div>

		<!-- Today's Activity -->
		<div class={cx(cardStyles, 'bg-white shadow-sm')}>
			<div class={cardBodyStyles}>
				<div class="mb-4 flex items-center gap-2">
					<Activity class="h-5 w-5 text-[#FF6B6B]" />
					<h3 class="text-lg font-semibold text-gray-900">Today's Activity</h3>
				</div>
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-green-100 p-2">
							<DollarSign class="h-4 w-4 text-green-600" />
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium">Revenue</p>
							<p class="text-xs text-gray-600">48 transactions</p>
						</div>
						<p class="text-sm font-bold">Rp 2.45M</p>
					</div>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-blue-100 p-2">
							<Coffee class="h-4 w-4 text-blue-600" />
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium">Best Seller</p>
							<p class="text-xs text-gray-600">Chocolate Shake</p>
						</div>
						<p class="text-sm font-bold">23 sold</p>
					</div>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-purple-100 p-2">
							<Users class="h-4 w-4 text-purple-600" />
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium">Customers</p>
							<p class="text-xs text-gray-600">New & returning</p>
						</div>
						<p class="text-sm font-bold">48</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
