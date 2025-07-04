<script lang="ts">
	import { useSession } from '$lib/auth';
	import Button from '$lib/components/Button.svelte';
	import {
		ShoppingCart,
		DollarSign,
		TrendingUp,
		AlertTriangle,
		Package,
		Clock,
		ExternalLink,
		ChevronRight
	} from '@lucide/svelte';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';
	import DailySalesChart from '$lib/components/charts/DailySalesChart.svelte';
	import ChannelPerformanceChart from '$lib/components/charts/ChannelPerformanceChart.svelte';
	import ChannelComparisonChart from '$lib/components/charts/ChannelComparisonChart.svelte';

	const session = useSession();
	let { data }: { data: PageData } = $props();

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function getStockPercentage(current: number, minimum: number) {
		if (minimum === 0) return 100;
		return Math.round((current / minimum) * 100);
	}

	function getStockStatus(current: number, minimum: number) {
		if (current === 0) return { label: 'Out of Stock', class: 'text-error' };
		if (current <= minimum) return { label: 'Low Stock', class: 'text-warning' };
		return { label: 'In Stock', class: 'text-success' };
	}
</script>

<svelte:head>
	<title>Dashboard - Klimboys POS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Welcome Section -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">Welcome back, {$session.data?.user.name}!</h1>
			<p class="text-base-content/70 mt-1">
				Here's your store overview for {jakartaTime.dayDate(new Date())}
			</p>
		</div>
		<Button variant="primary" href="/dashboard/transactions/new" icon={ShoppingCart}>
			New Transaction
		</Button>
	</div>

	<!-- Low Stock Alert -->
	{#if data.lowStockItems.length > 0}
		<div class="alert alert-warning shadow-lg">
			<div class="flex w-full items-start justify-between">
				<div class="flex items-start gap-3">
					<AlertTriangle class="h-6 w-6 flex-shrink-0" />
					<div class="space-y-1">
						<h3 class="font-bold">Low Stock Alert</h3>
						<p class="text-sm">
							{data.stats.lowStockCount} items are running low.
							{#if data.stats.outOfStockCount > 0}
								<span class="font-semibold"
									>{data.stats.outOfStockCount} items are out of stock!</span
								>
							{/if}
						</p>
						<div class="mt-2 flex flex-wrap gap-2">
							{#each data.lowStockItems.slice(0, 3) as item}
								{@const status = getStockStatus(item.currentStock, item.minimumStock)}
								<div class="badge badge-outline">
									<span class="{status.class} mr-1">•</span>
									{item.name}: {item.currentStock}/{item.minimumStock}
									{item.unit}
								</div>
							{/each}
							{#if data.lowStockItems.length > 3}
								<div class="badge badge-outline">+{data.lowStockItems.length - 3} more</div>
							{/if}
						</div>
					</div>
				</div>
				<Button
					size="sm"
					variant="ghost"
					href="/dashboard/inventory"
					icon={ExternalLink}
					class="flex-shrink-0"
				>
					View Inventory
				</Button>
			</div>
		</div>
	{/if}

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-primary">
					<ShoppingCart class="h-8 w-8" />
				</div>
				<div class="stat-title">Today's Transactions</div>
				<div class="stat-value">{data.stats.todayTransactions}</div>
				<div class="stat-desc">Updated in real-time</div>
			</div>
		</div>

		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-success">
					<DollarSign class="h-8 w-8" />
				</div>
				<div class="stat-title">Today's Revenue</div>
				<div class="stat-value text-success">{formatCurrency(data.stats.todayRevenue)}</div>
				<div class="stat-desc">Gross revenue</div>
			</div>
		</div>

		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-info">
					<TrendingUp class="h-8 w-8" />
				</div>
				<div class="stat-title">Month Revenue</div>
				<div class="stat-value text-info">{formatCurrency(data.stats.monthRevenue)}</div>
				<div class="stat-desc">{jakartaTime.monthYear(new Date())}</div>
			</div>
		</div>

		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-warning">
					<Package class="h-8 w-8" />
				</div>
				<div class="stat-title">Low Stock Items</div>
				<div class="stat-value text-warning">{data.stats.lowStockCount}</div>
				<div class="stat-desc">
					{#if data.stats.outOfStockCount > 0}
						<span class="text-error">{data.stats.outOfStockCount} out of stock</span>
					{:else}
						All items in stock
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Daily Sales Chart -->
	<DailySalesChart data={data.dailySalesData} height="400px" />

	<!-- Channel Performance Section -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Channel Revenue Distribution -->
		<ChannelPerformanceChart 
			data={data.channelPerformance} 
			type="revenue" 
			height="350px" 
		/>
		
		<!-- Channel Transaction Distribution -->
		<ChannelPerformanceChart 
			data={data.channelPerformance} 
			type="transactions" 
			height="350px" 
		/>
	</div>

	<!-- Channel Comparison Chart -->
	<ChannelComparisonChart 
		monthData={data.channelPerformance} 
		todayData={data.todayChannelPerformance} 
		height="400px" 
	/>

	<!-- Content Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Recent Transactions -->
		<div class="lg:col-span-2">
			<div class="bg-base-100 rounded-box shadow">
				<div class="flex items-center justify-between border-b p-4">
					<h3 class="text-lg font-bold">Recent Transactions</h3>
					<Button size="sm" variant="ghost" href="/dashboard/transactions" icon={ChevronRight}>
						View All
					</Button>
				</div>
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Transaction #</th>
								<th>Time</th>
								<th>Items</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentTransactions as trx}
								<tr>
									<td class="font-medium">{trx.transactionNumber}</td>
									<td>
										<div class="flex items-center gap-1">
											<Clock class="text-base-content/50 h-4 w-4" />
											<span class="text-sm">{jakartaTime.time(trx.createdAt)}</span>
										</div>
									</td>
									<td>
										<div class="flex flex-col gap-1">
											{#each trx.items.slice(0, 2) as item}
												<span class="text-sm">
													{item.quantity}x {item.product?.title}
												</span>
											{/each}
											{#if trx.items.length > 2}
												<span class="text-base-content/50 text-sm"
													>+{trx.items.length - 2} more</span
												>
											{/if}
										</div>
									</td>
									<td class="font-semibold">{formatCurrency(trx.totalAmount)}</td>
								</tr>
							{:else}
								<tr>
									<td colspan="4" class="py-8 text-center text-base-content/50">
										No transactions yet today.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Best Selling Products -->
		<div>
			<div class="bg-base-100 rounded-box shadow">
				<div class="border-b p-4">
					<h3 class="text-lg font-bold">Today's Best Sellers</h3>
				</div>
				<div class="p-4">
					{#if data.bestSellingToday.length > 0}
						<div class="space-y-3">
							{#each data.bestSellingToday as product, index}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div class="badge badge-lg font-bold">{index + 1}</div>
										<div>
											<p class="font-medium">{product.title}</p>
											<p class="text-base-content/70 text-sm">
												{product.totalQuantity} sold
											</p>
										</div>
									</div>
									<div class="text-right">
										<p class="font-semibold">{formatCurrency(product.totalRevenue)}</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-base-content/50 py-8 text-center">No sales data yet today.</div>
					{/if}
				</div>
			</div>

			<!-- Critical Low Stock Items -->
			{#if data.lowStockItems.length > 0}
				<div class="bg-base-100 rounded-box mt-6 shadow">
					<div class="border-b p-4">
						<h3 class="text-lg font-bold">Critical Stock Levels</h3>
					</div>
					<div class="divide-y p-4">
						{#each data.lowStockItems.slice(0, 5) as item}
							{@const percentage = getStockPercentage(item.currentStock, item.minimumStock)}
							{@const status = getStockStatus(item.currentStock, item.minimumStock)}
							<div class="py-3 first:pt-0 last:pb-0">
								<div class="mb-2 flex items-start justify-between">
									<div>
										<p class="font-medium">{item.name}</p>
										<p class="text-sm {status.class}">
											{item.currentStock}/{item.minimumStock}
											{item.unit} • {status.label}
										</p>
									</div>
								</div>
								<div class="bg-base-200 relative mt-2 h-2 w-full overflow-hidden rounded-full">
									<div
										class="h-full transition-all duration-300"
										class:bg-error={item.currentStock === 0}
										class:bg-warning={item.currentStock > 0 &&
											item.currentStock <= item.minimumStock}
										class:bg-success={item.currentStock > item.minimumStock}
										style="width: {Math.min(percentage, 100)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
