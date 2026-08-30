<script lang="ts">
	import { ArrowLeft, ArrowRight, Search } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import {
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		compactTableStyles,
		cx,
		inputStyles
	} from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function pageHref(page: number): string {
		const params = new SvelteURLSearchParams();
		if (data.inventory.search) params.set('search', data.inventory.search);
		if (data.inventory.lowOnly) params.set('low', 'true');
		params.set('page', String(page));
		return `/staff/inventory?${params.toString()}`;
	}
</script>

<svelte:head>
	<title>Inventory - Klimboys</title>
	<meta name="description" content="Review Klimboys stock by product and size." />
</svelte:head>

<div class="mb-6">
	<h1 class="text-3xl font-bold text-gray-900">Inventory</h1>
	<p class="mt-1 text-gray-600">Review current quantities by sellable size.</p>
</div>

<form method="GET" class={cx(cardStyles, 'mb-6 bg-white shadow-sm')}>
	<div class={cx(cardBodyStyles, 'gap-4 sm:flex-row sm:items-end')}>
		<div class="min-w-0 flex-1">
			<label for="inventory-search" class="mb-2 block text-sm font-medium text-gray-700">
				Search product or size
			</label>
			<div class="relative">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
				/>
				<input
					id="inventory-search"
					name="search"
					value={data.inventory.search}
					class={cx(inputStyles({ full: true }), 'pl-10')}
				/>
			</div>
		</div>
		<label class="flex h-10 items-center gap-2 text-sm font-medium text-gray-700">
			<input type="checkbox" name="low" value="true" checked={data.inventory.lowOnly} />
			Low stock only
		</label>
		<button type="submit" class={buttonStyles({ tone: 'brand' })}>Apply filters</button>
		<a href="/staff/inventory" class={buttonStyles({ variant: 'ghost' })}>Clear</a>
	</div>
</form>

<div class={cx(cardStyles, 'bg-white shadow-sm')}>
	<div class={cardBodyStyles}>
		<div class="mb-2 flex flex-wrap items-center justify-between gap-3">
			<p class="font-semibold text-gray-900">{data.inventory.totalItems} active variants</p>
			<p class="text-xs text-gray-500">
				Low stock is {data.inventory.lowStockThreshold} units or fewer.
			</p>
		</div>
		{#if data.inventory.items.length === 0}
			<div class="py-12 text-center">
				<p class="font-semibold text-gray-900">No inventory matches these filters</p>
				<p class="mt-1 text-sm text-gray-600">Clear the filters to review all active stock.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class={compactTableStyles}>
					<thead>
						<tr>
							<th>Product</th>
							<th>Size</th>
							<th>Volume</th>
							<th>Quantity</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.inventory.items as item (item.variantId)}
							{@const low = item.stockQuantity <= data.inventory.lowStockThreshold}
							<tr>
								<td class="font-medium text-gray-900">{item.productName}</td>
								<td>{item.size}</td>
								<td>{item.volumeMl} ml</td>
								<td class="font-semibold">{item.stockQuantity}</td>
								<td>
									<span class={badgeStyles(low ? 'caution' : 'positive', 'sm')}>
										{low ? 'Low stock' : 'In stock'}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if data.inventory.totalPages > 1}
	<nav class="mt-6 flex items-center justify-between" aria-label="Inventory pages">
		{#if data.inventory.page > 1}
			<a href={pageHref(data.inventory.page - 1)} class={buttonStyles({ variant: 'outline' })}>
				<ArrowLeft class="h-4 w-4" /> Previous
			</a>
		{:else}
			<span></span>
		{/if}
		<p class="text-sm text-gray-600">
			Page {data.inventory.page} of {data.inventory.totalPages}
		</p>
		{#if data.inventory.page < data.inventory.totalPages}
			<a href={pageHref(data.inventory.page + 1)} class={buttonStyles({ variant: 'outline' })}>
				Next <ArrowRight class="h-4 w-4" />
			</a>
		{:else}
			<span></span>
		{/if}
	</nav>
{/if}
