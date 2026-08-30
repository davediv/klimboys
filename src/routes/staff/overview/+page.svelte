<script lang="ts">
	import { Activity, AlertCircle, Coffee, DollarSign, Package, ShoppingCart } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { APP_LANGUAGE_TAG, APP_TIME_ZONE } from '$lib/business';
	import { formatIdr } from '$lib/format';
	import {
		alertStyles,
		badgeStyles,
		cardBodyStyles,
		cardStyles,
		compactTableStyles,
		cx
	} from '$lib/styles';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const quickActions = {
		admin: [
			{
				icon: ShoppingCart,
				label: 'New Transaction',
				href: '/staff/pos',
				color: 'bg-[#FF6B6B] text-white'
			},
			{
				icon: Package,
				label: 'Manage Products',
				href: '/staff/catalog',
				color: 'bg-blue-600 text-white'
			},
			{
				icon: AlertCircle,
				label: 'Review Inventory',
				href: '/staff/inventory',
				color: 'bg-orange-600 text-white'
			}
		],
		cashier: [
			{
				icon: ShoppingCart,
				label: 'New Transaction',
				href: '/staff/pos',
				color: 'bg-[#FF6B6B] text-white'
			}
		]
	} as const;

	let stats = $derived(
		data.dashboard
			? [
					{
						label: "Today's Revenue",
						value: formatIdr(data.dashboard.today.revenue / 100),
						context: `${formatIdr(data.dashboard.yesterday.revenue / 100)} yesterday`,
						icon: DollarSign,
						color: 'text-green-600 bg-green-100'
					},
					{
						label: 'Orders Today',
						value: String(data.dashboard.today.orders),
						context: `${data.dashboard.yesterday.orders} yesterday`,
						icon: ShoppingCart,
						color: 'text-blue-600 bg-blue-100'
					},
					{
						label: 'Active Products',
						value: String(data.dashboard.activeProducts),
						context: 'Live catalog count',
						icon: Package,
						color: 'text-purple-600 bg-purple-100'
					},
					{
						label: 'Low Stock Variants',
						value: String(data.dashboard.lowStockCount),
						context: `At or below ${data.dashboard.lowStockThreshold} units`,
						icon: AlertCircle,
						color: 'text-orange-600 bg-orange-100'
					}
				]
			: []
	);

	function getQuickActions(role: string | undefined) {
		return role === 'admin' ? quickActions.admin : quickActions.cashier;
	}

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

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat(APP_LANGUAGE_TAG, {
			timeZone: APP_TIME_ZONE,
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(new Date(value));
	}
</script>

<svelte:head>
	<title>Store Overview - Klimboys</title>
	<meta name="description" content="Live Klimboys sales and inventory overview." />
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-gray-900">
		Welcome back, {data.user?.name || data.user?.email?.split('@')[0]}! 👋
	</h1>
	<p class="mt-1 text-gray-600">Live sales and stock activity for the store.</p>
	{#if data.dashboard}
		<p class="mt-1 text-xs text-gray-500">
			Updated {formatDateTime(data.dashboard.generatedAt)} WIB
		</p>
	{/if}
</div>

{#if data.dashboardError}
	<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{data.dashboardError}</div>
{/if}

{#if data.dashboard}
	<div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat (stat.label)}
			{@const StatIcon = stat.icon}
			<div class={cx(cardStyles, 'bg-white shadow-sm')}>
				<div class={cardBodyStyles}>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-gray-600">{stat.label}</p>
							<p class="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
							<p class="mt-2 text-xs font-medium text-gray-600">{stat.context}</p>
						</div>
						<div class={`rounded-lg p-3 ${stat.color}`}>
							<StatIcon class="h-6 w-6" />
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<div class="mb-6">
	<h2 class="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each getQuickActions(data.user?.role) as action (action.href)}
			{@const ActionIcon = action.icon}
			<a
				href={action.href}
				class={cx(cardStyles, action.color, 'shadow-sm transition-shadow hover:shadow-md')}
			>
				<div class={cx(cardBodyStyles, 'items-center p-4 text-center')}>
					<ActionIcon class="mb-2 h-8 w-8" />
					<p class="text-sm font-medium">{action.label}</p>
				</div>
			</a>
		{/each}
	</div>
</div>

{#if data.dashboard}
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<div class={cx(cardStyles, 'bg-white shadow-sm')}>
				<div class={cardBodyStyles}>
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Recent Transactions</h2>
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
								{#each data.dashboard.recentTransactions as transaction (transaction.transactionCode)}
									<tr class="transition-colors hover:bg-surface-muted">
										<td class="font-medium">{transaction.transactionCode}</td>
										<td class="text-gray-600">{formatDateTime(transaction.createdAt)} WIB</td>
										<td>{transaction.itemQuantity}</td>
										<td class="font-semibold">{formatIdr(transaction.total / 100)}</td>
										<td>
											<span class={getStatusBadge(transaction.status)}>{transaction.status}</span>
										</td>
									</tr>
								{/each}
								{#if data.dashboard.recentTransactions.length === 0}
									<tr>
										<td colspan="5" class="py-8 text-center text-gray-500">
											No transactions have been recorded yet.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<div class={cx(cardStyles, 'bg-white shadow-sm')}>
				<div class={cardBodyStyles}>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
						<span class={badgeStyles('caution', 'sm')}>
							{data.dashboard.lowStockCount} items
						</span>
					</div>
					<div class="space-y-3">
						{#each data.dashboard.lowStockItems as item (item.variantId)}
							<div class="flex items-center justify-between rounded-lg bg-orange-50 p-3">
								<div>
									<p class="text-sm font-medium text-gray-900">{item.name} ({item.size})</p>
									<p class="text-xs text-gray-600">
										Alert threshold: {data.dashboard.lowStockThreshold}
									</p>
								</div>
								<span class={badgeStyles('danger')}>{item.stockQuantity} left</span>
							</div>
						{/each}
						{#if data.dashboard.lowStockItems.length === 0}
							<p class="rounded-lg bg-green-50 p-3 text-sm text-green-800">
								No active variants are below the alert threshold.
							</p>
						{/if}
					</div>
					<a
						href="/staff/inventory?low=true"
						class="mt-4 inline-flex text-sm font-semibold text-brand hover:underline"
					>
						Review low-stock inventory
					</a>
				</div>
			</div>

			<div class={cx(cardStyles, 'bg-white shadow-sm')}>
				<div class={cardBodyStyles}>
					<div class="mb-4 flex items-center gap-2">
						<Activity class="h-5 w-5 text-[#FF6B6B]" />
						<h2 class="text-lg font-semibold text-gray-900">Today's Activity</h2>
					</div>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-green-100 p-2">
								<DollarSign class="h-4 w-4 text-green-600" />
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium">Revenue</p>
								<p class="text-xs text-gray-600">{data.dashboard.today.orders} transactions</p>
							</div>
							<p class="text-sm font-bold">{formatIdr(data.dashboard.today.revenue / 100)}</p>
						</div>
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-blue-100 p-2">
								<Coffee class="h-4 w-4 text-blue-600" />
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium">Best Seller</p>
								<p class="text-xs text-gray-600">
									{data.dashboard.bestSeller?.name ?? 'No completed sales yet'}
								</p>
							</div>
							<p class="text-sm font-bold">
								{data.dashboard.bestSeller?.quantity ?? 0} sold
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
