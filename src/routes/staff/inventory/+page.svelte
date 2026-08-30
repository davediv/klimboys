<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, X } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { APP_LANGUAGE_TAG, APP_TIME_ZONE } from '$lib/business';
	import type {
		InventoryAdjustmentResponse,
		InventoryAdjustmentType,
		InventoryItem
	} from '$lib/inventory';
	import {
		alertStyles,
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		compactTableStyles,
		cx,
		fieldHintStyles,
		fieldLabelStyles,
		inputStyles,
		selectStyles,
		spinnerStyles,
		textareaStyles
	} from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedItem = $state<InventoryItem | null>(null);
	let adjustmentType = $state<InventoryAdjustmentType>('restock');
	let quantity = $state(1);
	let reason = $state('');
	let isSaving = $state(false);
	let adjustmentError = $state('');
	let successMessage = $state('');
	let pendingIdempotencyKey: string | null = null;
	let pendingFingerprint: string | null = null;
	let projectedQuantity = $derived(
		selectedItem
			? adjustmentType === 'restock'
				? selectedItem.stockQuantity + Number(quantity || 0)
				: adjustmentType === 'waste'
					? selectedItem.stockQuantity - Number(quantity || 0)
					: Number(quantity || 0)
			: 0
	);

	function pageHref(page: number): string {
		const params = new SvelteURLSearchParams();
		if (data.inventory.search) params.set('search', data.inventory.search);
		if (data.inventory.lowOnly) params.set('low', 'true');
		params.set('page', String(page));
		return `/staff/inventory?${params.toString()}`;
	}

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat(APP_LANGUAGE_TAG, {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: APP_TIME_ZONE
		}).format(new Date(value));
	}

	function openAdjustment(item: InventoryItem) {
		selectedItem = item;
		adjustmentType = 'restock';
		quantity = 1;
		reason = '';
		adjustmentError = '';
		successMessage = '';
		pendingIdempotencyKey = null;
		pendingFingerprint = null;
	}

	function closeAdjustment() {
		selectedItem = null;
		adjustmentError = '';
		pendingIdempotencyKey = null;
		pendingFingerprint = null;
	}

	async function saveAdjustment() {
		if (!selectedItem || isSaving) return;

		const requestWithoutKey = {
			variantId: selectedItem.variantId,
			type: adjustmentType,
			quantity: Number(quantity),
			reason
		};
		const fingerprint = JSON.stringify(requestWithoutKey);
		if (!pendingIdempotencyKey || pendingFingerprint !== fingerprint) {
			pendingIdempotencyKey = crypto.randomUUID();
			pendingFingerprint = fingerprint;
		}

		isSaving = true;
		adjustmentError = '';
		successMessage = '';
		try {
			const response = await fetch('/api/inventory/adjustments', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ...requestWithoutKey, idempotencyKey: pendingIdempotencyKey })
			});
			const result = (await response.json()) as InventoryAdjustmentResponse;
			if (!response.ok || !result.success || !result.data) {
				throw new Error(result.error || 'The inventory adjustment could not be saved.');
			}

			successMessage = `${result.data.productName} (${result.data.size}) now has ${result.data.quantityAfter} units.${result.data.alreadyProcessed ? ' Duplicate submission safely ignored.' : ''}`;
			selectedItem = null;
			pendingIdempotencyKey = null;
			pendingFingerprint = null;
			await invalidateAll();
		} catch (error) {
			adjustmentError =
				error instanceof Error
					? error.message
					: 'The adjustment could not be confirmed. Retry to safely check its status.';
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Inventory - Klimboys</title>
	<meta name="description" content="Review and adjust Klimboys inventory with an audit trail." />
</svelte:head>

<div class="mb-6">
	<h1 class="text-3xl font-bold text-gray-900">Inventory</h1>
	<p class="mt-1 text-gray-600">
		Review quantities, record stock movements, and keep an audit trail.
	</p>
</div>

{#if successMessage}
	<div class={cx(alertStyles('positive'), 'mb-6')} role="status">{successMessage}</div>
{/if}
{#if adjustmentError && !selectedItem}
	<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{adjustmentError}</div>
{/if}

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

{#if selectedItem}
	<form
		id="inventory-adjustment-form"
		class={cx(cardStyles, 'mb-6 border border-brand/30 bg-white shadow-sm')}
		onsubmit={(event) => {
			event.preventDefault();
			void saveAdjustment();
		}}
	>
		<div class={cardBodyStyles}>
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">
						Adjust {selectedItem.productName} ({selectedItem.size})
					</h2>
					<p class="text-gray-600">Current quantity: {selectedItem.stockQuantity}</p>
				</div>
				<button
					type="button"
					class={buttonStyles({ variant: 'ghost', shape: 'square' })}
					onclick={closeAdjustment}
					aria-label="Close inventory adjustment"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if adjustmentError}
				<div class={alertStyles('danger')} role="alert">{adjustmentError}</div>
			{/if}

			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label for="adjustment-type" class={fieldLabelStyles}>Movement type</label>
					<select
						id="adjustment-type"
						class={selectStyles({ full: true })}
						bind:value={adjustmentType}
					>
						<option value="restock">Restock received</option>
						<option value="waste">Waste or damage</option>
						<option value="correction">Stock count correction</option>
					</select>
				</div>
				<div>
					<label for="adjustment-quantity" class={fieldLabelStyles}>
						{adjustmentType === 'correction' ? 'New total quantity' : 'Number of units'}
					</label>
					<input
						id="adjustment-quantity"
						type="number"
						class={inputStyles({ full: true })}
						bind:value={quantity}
						min={adjustmentType === 'correction' ? 0 : 1}
						max="100000"
						required
					/>
					<span class={fieldHintStyles}>Projected quantity: {projectedQuantity}</span>
				</div>
			</div>
			<div>
				<label for="adjustment-reason" class={fieldLabelStyles}>Reason</label>
				<textarea
					id="adjustment-reason"
					class={textareaStyles({ full: true })}
					bind:value={reason}
					maxlength="500"
					required
					placeholder="For example: supplier delivery INV-204 or damaged during handling"
				></textarea>
			</div>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class={buttonStyles({ variant: 'ghost' })}
					onclick={closeAdjustment}
					disabled={isSaving}>Cancel</button
				>
				<button type="submit" class={buttonStyles({ tone: 'brand' })} disabled={isSaving}>
					{#if isSaving}<span class={spinnerStyles('sm')}></span>{/if}
					{isSaving ? 'Saving…' : 'Record adjustment'}
				</button>
			</div>
		</div>
	</form>
{/if}

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
							{#if data.canAdjust}<th><span class="sr-only">Actions</span></th>{/if}
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
								{#if data.canAdjust}
									<td class="text-right">
										<button
											type="button"
											class={buttonStyles({ variant: 'outline', size: 'sm' })}
											onclick={() => openAdjustment(item)}
											aria-controls="inventory-adjustment-form"
										>
											<SlidersHorizontal class="h-4 w-4" /> Adjust
										</button>
									</td>
								{/if}
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

<section
	class={cx(cardStyles, 'mt-6 bg-white shadow-sm')}
	aria-labelledby="adjustment-history-title"
>
	<div class={cardBodyStyles}>
		<div>
			<h2 id="adjustment-history-title" class="text-lg font-semibold text-gray-900">
				Recent stock movements
			</h2>
			<p class="text-gray-600">Restocks, waste, and count corrections are retained for audit.</p>
		</div>
		{#if data.recentAdjustments.length === 0}
			<p class="py-6 text-center text-gray-600">No manual stock movements have been recorded.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class={compactTableStyles}>
					<thead>
						<tr>
							<th>Date</th>
							<th>Product</th>
							<th>Type</th>
							<th>Change</th>
							<th>After</th>
							<th>Reason</th>
							<th>By</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentAdjustments as adjustment (adjustment.id)}
							<tr>
								<td class="whitespace-nowrap">{formatDateTime(adjustment.createdAt)}</td>
								<td class="font-medium">{adjustment.productName} ({adjustment.size})</td>
								<td class="capitalize">{adjustment.type}</td>
								<td class={adjustment.quantityChange > 0 ? 'text-positive' : 'text-danger'}>
									{adjustment.quantityChange > 0 ? '+' : ''}{adjustment.quantityChange}
								</td>
								<td>{adjustment.quantityAfter}</td>
								<td class="max-w-64 whitespace-normal">{adjustment.reason}</td>
								<td>{adjustment.performedBy}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</section>
