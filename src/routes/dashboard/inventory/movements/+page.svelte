<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import {
		TrendingUp,
		TrendingDown,
		BarChart3,
		Filter,
		ArrowLeft,
		ArrowRight,
		FileText,
		RefreshCw
	} from '@lucide/svelte';
	import { jakartaTime } from '$lib/utils/datetime';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function getMovementIcon(type: string) {
		switch (type) {
			case 'in':
				return TrendingUp;
			case 'out':
				return TrendingDown;
			default:
				return RefreshCw;
		}
	}

	function getMovementColor(type: string) {
		switch (type) {
			case 'in':
				return 'text-success';
			case 'out':
				return 'text-error';
			default:
				return 'text-info';
		}
	}

	function formatMovementType(type: string) {
		switch (type) {
			case 'in':
				return 'Stock In';
			case 'out':
				return 'Stock Out';
			case 'adjustment':
				return 'Adjustment';
			default:
				return type;
		}
	}

	async function updateFilters(newFilters: Partial<typeof data.filters>) {
		const params = new URLSearchParams($page.url.searchParams);

		Object.entries(newFilters).forEach(([key, value]) => {
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		});

		await goto(`?${params.toString()}`);
	}

	async function changePage(newPage: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', newPage.toString());
		await goto(`?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Stock Movement History - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">Stock Movement History</h1>
			<p class="text-base-content/70 mt-1">Track all inventory changes and adjustments</p>
		</div>
		<Button variant="ghost" href="/dashboard/inventory" icon={ArrowLeft}>Back to Inventory</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-success">
					<TrendingUp class="h-8 w-8" />
				</div>
				<div class="stat-title">Total Stock In</div>
				<div class="stat-value text-success">{data.stats.totalIn}</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-error">
					<TrendingDown class="h-8 w-8" />
				</div>
				<div class="stat-title">Total Stock Out</div>
				<div class="stat-value text-error">{data.stats.totalOut}</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-info">
					<RefreshCw class="h-8 w-8" />
				</div>
				<div class="stat-title">Adjustments</div>
				<div class="stat-value text-info">{data.stats.totalAdjustments}</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-base-100 rounded-box p-4 shadow">
		<div class="flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-2">
				<Filter class="text-base-content/50 h-5 w-5" />
				<span class="font-medium">Filters:</span>
			</div>

			<select
				class="select select-bordered select-sm"
				value={data.filters.inventoryId || ''}
				onchange={(e) => updateFilters({ inventory: e.currentTarget.value || undefined })}
			>
				<option value="">All Items</option>
				{#each data.inventoryItems as item}
					<option value={item.id}>{item.name}</option>
				{/each}
			</select>

			<select
				class="select select-bordered select-sm"
				value={data.filters.movementType || ''}
				onchange={(e) => updateFilters({ type: e.currentTarget.value || undefined })}
			>
				<option value="">All Types</option>
				<option value="in">Stock In</option>
				<option value="out">Stock Out</option>
				<option value="adjustment">Adjustments</option>
			</select>

			{#if data.filters.inventoryId || data.filters.movementType}
				<Button
					size="sm"
					variant="ghost"
					onclick={() => updateFilters({ inventory: undefined, type: undefined })}
				>
					Clear Filters
				</Button>
			{/if}
		</div>
	</div>

	<!-- Movement History -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Date & Time</th>
						<th>Item</th>
						<th>Type</th>
						<th>Quantity</th>
						<th>Reason</th>
						<th>Transaction</th>
						<th>By</th>
					</tr>
				</thead>
				<tbody>
					{#each data.movements as movement}
						{@const Icon = getMovementIcon(movement.type)}
						<tr>
							<td>
								<div>
									<div class="text-sm font-medium">
										{jakartaTime.dayDate(movement.createdAt)}
									</div>
									<div class="text-base-content/70 text-xs">
										{jakartaTime.time(movement.createdAt)}
									</div>
								</div>
							</td>
							<td>
								<span class="font-medium">{movement.inventory?.name}</span>
							</td>
							<td>
								<div class="flex items-center gap-2">
									<Icon class="{getMovementColor(movement.type)} h-4 w-4" />
									<span class="text-sm">{formatMovementType(movement.type)}</span>
								</div>
							</td>
							<td>
								<span class="font-semibold">
									{movement.type === 'out' ? '-' : '+'}{movement.quantity}
									{movement.inventory?.unit}
								</span>
							</td>
							<td>
								<span class="text-sm">{movement.reason}</span>
							</td>
							<td>
								{#if movement.transaction}
									<a
										href="/dashboard/transactions"
										class="link link-primary flex items-center gap-1 text-sm"
									>
										<FileText class="h-3 w-3" />
										{movement.transaction.transactionNumber}
									</a>
								{:else}
									<span class="text-base-content/50 text-sm">Manual</span>
								{/if}
							</td>
							<td>
								<span class="text-base-content/70 text-sm">{movement.createdByUser?.name}</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="py-8 text-center text-base-content/50">
								No stock movements found.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.movements.length > 0}
			<div class="flex items-center justify-between border-t p-4">
				<div class="text-base-content/70 text-sm">
					Page {data.pagination.page}
				</div>
				<div class="flex gap-2">
					<Button
						size="sm"
						variant="ghost"
						square
						icon={ArrowLeft}
						disabled={data.pagination.page === 1}
						onclick={() => changePage(data.pagination.page - 1)}
					/>
					<Button
						size="sm"
						variant="ghost"
						square
						icon={ArrowRight}
						disabled={!data.pagination.hasMore}
						onclick={() => changePage(data.pagination.page + 1)}
					/>
				</div>
			</div>
		{/if}
	</div>
</div>
