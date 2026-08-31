<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		AlertCircle,
		Archive,
		ArrowLeft,
		ArrowRight,
		Edit,
		Package,
		Plus,
		RotateCcw,
		Search
	} from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ArchiveProductDialog from '$lib/components/catalog/ArchiveProductDialog.svelte';
	import CatalogProductDialog from '$lib/components/catalog/CatalogProductDialog.svelte';
	import { restoreCatalogProduct } from '$lib/catalog-client';
	import { formatIdr } from '$lib/format';
	import type { CatalogProduct } from '$lib/product';
	import {
		alertStyles,
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		cx,
		fieldLabelStyles,
		inputStyles,
		selectStyles,
		spinnerStyles,
		tableStyles
	} from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showProductDialog = $state(false);
	let editingProduct = $state<CatalogProduct | null>(null);
	let productToArchive = $state<CatalogProduct | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(data.productsError);
	let successMessage = $state<string | null>(null);
	let products = $state<CatalogProduct[]>(data.products);

	$effect(() => {
		products = data.products;
		if (data.productsError) error = data.productsError;
	});

	function openAddDialog() {
		editingProduct = null;
		showProductDialog = true;
	}

	function openEditDialog(product: CatalogProduct) {
		editingProduct = product;
		showProductDialog = true;
	}

	function showSuccess(message: string) {
		successMessage = message;
		error = null;
		setTimeout(() => (successMessage = null), 3000);
		void invalidateAll().catch((refreshError) => {
			console.error('Catalog changed, but the refreshed list could not be loaded:', refreshError);
		});
	}

	function handleArchived() {
		if (productToArchive) {
			products =
				data.status === 'all'
					? products.map((product) =>
							product.id === productToArchive?.id ? { ...product, isActive: false } : product
						)
					: products.filter((product) => product.id !== productToArchive?.id);
		}
		showSuccess('Product archived successfully.');
	}

	async function restoreProduct(product: CatalogProduct) {
		if (loading) return;
		loading = true;
		error = null;
		try {
			const restoredProduct = await restoreCatalogProduct(product.id);
			products =
				data.status === 'all'
					? products.map((candidate) =>
							candidate.id === restoredProduct.id ? restoredProduct : candidate
						)
					: products.filter((candidate) => candidate.id !== restoredProduct.id);
			showSuccess('Product restored successfully.');
		} catch (restoreError) {
			error =
				restoreError instanceof Error ? restoreError.message : 'The product could not be restored.';
		} finally {
			loading = false;
		}
	}

	function pageHref(page: number): string {
		const params = new SvelteURLSearchParams();
		if (data.search) params.set('search', data.search);
		if (data.status !== 'active') params.set('status', data.status);
		if (page > 1) params.set('page', String(page));
		const query = params.toString();
		return query ? `/staff/catalog?${query}` : '/staff/catalog';
	}
</script>

<svelte:head>
	<title>Catalog - Klimboys</title>
	<meta name="description" content="Manage Klimboys products, variants, pricing, and lifecycle." />
</svelte:head>

<div class="container mx-auto p-4">
	{#if successMessage}
		<div class={cx(alertStyles('positive'), 'mb-4')} role="status">{successMessage}</div>
	{/if}
	{#if error}
		<div class={cx(alertStyles('danger'), 'mb-4')} role="alert">
			<AlertCircle class="h-6 w-6" />
			<span>{error}</span>
		</div>
	{/if}

	<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold">Catalog</h1>
			<p class="text-ink/70">
				Manage product details and pricing. Record quantity changes in
				<a class="font-medium underline" href="/staff/inventory">Inventory</a>.
			</p>
		</div>
		<button
			type="button"
			class={buttonStyles({ tone: 'brand' })}
			onclick={openAddDialog}
			disabled={loading}
		>
			<Plus class="h-5 w-5" />
			Add product
		</button>
	</div>

	<form method="GET" class={cx(cardStyles, 'mb-6 bg-surface shadow-xl')}>
		<div class={cardBodyStyles}>
			<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto_auto] sm:items-end">
				<div>
					<label for="catalog-search" class={fieldLabelStyles}>Search catalog</label>
					<div class="relative">
						<Search
							class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-ink/40"
						/>
						<input
							id="catalog-search"
							name="search"
							type="search"
							placeholder="Search by product or category"
							class={cx(inputStyles({ full: true }), 'pl-10')}
							value={data.search}
						/>
					</div>
				</div>
				<div>
					<label for="catalog-status" class={fieldLabelStyles}>Status</label>
					<select
						id="catalog-status"
						name="status"
						class={selectStyles({ full: true })}
						value={data.status}
					>
						<option value="active">Active</option>
						<option value="inactive">Archived</option>
						<option value="all">All</option>
					</select>
				</div>
				<button type="submit" class={buttonStyles({ tone: 'brand' })}>Apply filters</button>
				<a href="/staff/catalog" class={buttonStyles({ variant: 'ghost' })}>Clear</a>
			</div>
		</div>
	</form>

	<div class={cx(cardStyles, 'bg-surface shadow-xl')}>
		<div class={cardBodyStyles}>
			<p class="font-medium text-ink/70">
				{data.pagination.totalItems}
				{data.status === 'inactive' ? 'archived' : data.status} product{data.pagination
					.totalItems === 1
					? ''
					: 's'}
			</p>
			<div class="overflow-x-auto">
				<table class={tableStyles}>
					<thead>
						<tr>
							<th>Product</th>
							<th>Category</th>
							<th>Variants & pricing</th>
							<th>Stock</th>
							<th>Status</th>
							<th><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody>
						{#if loading && products.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center">
									<span class={spinnerStyles('lg')}></span>
									<p class="mt-2">Loading products…</p>
								</td>
							</tr>
						{:else if products.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center">
									<Package class="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>No products match this view</p>
									{#if data.search || data.status !== 'active'}
										<a
											href="/staff/catalog"
											class={cx(buttonStyles({ variant: 'outline', size: 'sm' }), 'mt-2')}
										>
											View active catalog
										</a>
									{:else}
										<button
											type="button"
											class={cx(buttonStyles({ tone: 'brand', size: 'sm' }), 'mt-2')}
											onclick={openAddDialog}
										>
											Add your first product
										</button>
									{/if}
								</td>
							</tr>
						{:else}
							{#each products as product (product.id)}
								<tr>
									<td>
										<div class="flex items-center space-x-3">
											<div
												class="aspect-square h-12 w-12 overflow-hidden bg-surface-muted squircle-mask"
											>
												{#if product.imageUrl}
													<img
														src={product.imageUrl}
														alt=""
														width="48"
														height="48"
														loading="lazy"
														decoding="async"
														class="h-full w-full object-cover"
													/>
												{:else}
													<Package class="m-auto mt-2 h-8 w-8" />
												{/if}
											</div>
											<div>
												<div class="font-bold">{product.name}</div>
												{#if product.description}
													<div class="max-w-56 truncate text-sm opacity-50">
														{product.description}
													</div>
												{/if}
											</div>
										</div>
									</td>
									<td>{product.category}</td>
									<td>
										<div class="space-y-1 text-sm">
											{#each product.variants as variant (variant.id)}
												<div>
													<span class="font-medium">{variant.size}</span>
													<span class="text-xs opacity-70">({variant.volumeMl} ml)</span>:
													{formatIdr(variant.sellingPrice / 100)}
												</div>
											{/each}
										</div>
									</td>
									<td>
										<div class="space-y-1 text-sm">
											{#each product.variants as variant (variant.id)}
												<div class="flex items-center gap-2">
													<span class="font-medium">{variant.size}:</span>
													<span
														class={badgeStyles(
															variant.stockQuantity < 10
																? 'danger'
																: variant.stockQuantity < 20
																	? 'caution'
																	: 'positive',
															'sm'
														)}
													>
														{variant.stockQuantity}
													</span>
												</div>
											{/each}
										</div>
									</td>
									<td>
										<span class={badgeStyles(product.isActive ? 'positive' : 'danger')}>
											{product.isActive ? 'Active' : 'Archived'}
										</span>
									</td>
									<td>
										<div class="flex justify-end gap-2">
											<button
												type="button"
												class={buttonStyles({ variant: 'ghost', size: 'xs' })}
												onclick={() => openEditDialog(product)}
												disabled={loading}
												aria-label={`Edit ${product.name}`}
											>
												<Edit class="h-4 w-4" />
											</button>
											{#if product.isActive}
												<button
													type="button"
													class={cx(buttonStyles({ variant: 'ghost', size: 'xs' }), 'text-danger')}
													onclick={() => (productToArchive = product)}
													disabled={loading}
													aria-label={`Archive ${product.name}`}
												>
													<Archive class="h-4 w-4" />
												</button>
											{:else}
												<button
													type="button"
													class={buttonStyles({
														variant: 'outline',
														tone: 'positive',
														size: 'xs'
													})}
													onclick={() => restoreProduct(product)}
													disabled={loading}
												>
													<RotateCcw class="h-4 w-4" /> Restore
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	{#if data.pagination.totalPages > 1}
		<nav class="mt-6 flex items-center justify-between" aria-label="Catalog pages">
			{#if data.pagination.hasPrev}
				<a href={pageHref(data.pagination.page - 1)} class={buttonStyles({ variant: 'outline' })}>
					<ArrowLeft class="h-4 w-4" /> Previous
				</a>
			{:else}
				<span></span>
			{/if}
			<p class="text-sm text-ink/60">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</p>
			{#if data.pagination.hasNext}
				<a href={pageHref(data.pagination.page + 1)} class={buttonStyles({ variant: 'outline' })}>
					Next <ArrowRight class="h-4 w-4" />
				</a>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
</div>

{#if showProductDialog}
	<CatalogProductDialog
		product={editingProduct}
		onClose={() => (showProductDialog = false)}
		onSaved={showSuccess}
	/>
{/if}

{#if productToArchive}
	<ArchiveProductDialog
		product={productToArchive}
		onClose={() => (productToArchive = null)}
		onArchived={handleArchived}
	/>
{/if}
