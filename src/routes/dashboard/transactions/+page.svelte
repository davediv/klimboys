<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { Plus, ShoppingCart, CreditCard, Calendar, User } from '@lucide/svelte';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';

	export let data: PageData;

	const channelIcons: Record<string, string> = {
		store: '🏪',
		grabfood: '🟢',
		gofood: '🔴',
		shopeefood: '🟠',
		ubereats: '⚫'
	};

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Transactions - Klimboys POS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">Transactions</h1>
			<p class="text-base-content/70 mt-1">View and create sales transactions</p>
		</div>
		<Button variant="primary" icon={Plus} href="/dashboard/transactions/new">
			New Transaction
		</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">Today's Sales</div>
				<div class="stat-value text-2xl">{formatCurrency(data.stats.todayTotal)}</div>
				<div class="stat-desc">{data.stats.todayCount} transactions</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">All Time Sales</div>
				<div class="stat-value text-2xl">{formatCurrency(data.stats.allTimeTotal)}</div>
				<div class="stat-desc">{data.stats.allTimeCount} transactions</div>
			</div>
		</div>
	</div>

	<!-- Transactions Table -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Date & Time</th>
						<th>Customer</th>
						<th>Items</th>
						<th>Channel</th>
						<th>Total</th>
						<th>Cashier</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.transactions as transaction}
						<tr class="hover">
							<td>
								<span class="font-mono text-sm">#{transaction.transactionNumber}</span>
							</td>
							<td>
								<div class="flex items-center gap-2">
									<Calendar class="text-base-content/50 h-4 w-4" />
									<div>
										<div class="text-sm font-medium">{jakartaTime.dayDate(transaction.createdAt)}</div>
										<div class="text-base-content/70 text-xs">
											{jakartaTime.time(transaction.createdAt)}
										</div>
									</div>
								</div>
							</td>
							<td>
								{#if transaction.customer}
									<div class="flex items-center gap-2">
										<User class="text-base-content/50 h-4 w-4" />
										<span class="text-sm">{transaction.customer.name}</span>
									</div>
								{:else}
									<span class="text-base-content/50 text-sm">Walk-in</span>
								{/if}
							</td>
							<td>
								<div class="flex items-center gap-2">
									<ShoppingCart class="text-base-content/50 h-4 w-4" />
									<div>
										{#each transaction.items.slice(0, 2) as item}
											<div class="text-sm">
												{item.quantity}x {item.product?.title || 'Unknown'}
											</div>
										{/each}
										{#if transaction.items.length > 2}
											<div class="text-base-content/50 text-xs">
												+{transaction.items.length - 2} more
											</div>
										{/if}
									</div>
								</div>
							</td>
							<td>
								<div class="flex items-center gap-1">
									<span class="text-sm">{channelIcons[transaction.channel] || ''}</span>
									<span class="text-sm capitalize">{transaction.channel}</span>
								</div>
							</td>
							<td>
								<span class="font-semibold">{formatCurrency(transaction.totalAmount)}</span>
							</td>
							<td>
								<span class="text-base-content/70 text-sm"
									>{transaction.cashier?.name || 'Unknown'}</span
								>
							</td>
							<td>
								<div class="badge badge-success badge-sm">Completed</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="text-center text-base-content/50 py-8">
								No transactions found. Create your first transaction to get started.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
