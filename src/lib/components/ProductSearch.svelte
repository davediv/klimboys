<script lang="ts">
	import { Search, Package } from '@lucide/svelte';
	import { formatIdr } from '$lib/format';
	import type { CatalogProduct, CatalogProductVariant, ProductListResponse } from '$lib/product';
	import { badgeStyles, buttonStyles, cx, inputStyles, spinnerStyles } from '$lib/styles';

	interface Props {
		onSelect?: (product: CatalogProduct, variant?: CatalogProductVariant) => void;
		placeholder?: string;
		showVariants?: boolean;
		apiEndpoint?: string;
	}

	let {
		onSelect,
		placeholder = 'Search products...',
		showVariants = true,
		apiEndpoint = '/api/products'
	}: Props = $props();

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<CatalogProduct[]>([]);
	let isSearching = $state(false);
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);
	let searchInput: HTMLInputElement;
	let debounceTimer: ReturnType<typeof setTimeout>;
	let activeSearchController: AbortController | null = null;

	function cancelActiveSearch() {
		activeSearchController?.abort();
		activeSearchController = null;
		isSearching = false;
	}

	// Perform search with debouncing
	async function performSearch(query: string) {
		cancelActiveSearch();
		const controller = new AbortController();
		activeSearchController = controller;

		isSearching = true;

		try {
			const response = await fetch(
				`${apiEndpoint}?search=${encodeURIComponent(query.trim())}&limit=10&active=true&includeMeta=false`,
				{ signal: controller.signal }
			);
			if (!response.ok) {
				throw new Error('Failed to search products');
			}

			const result = (await response.json()) as ProductListResponse;
			if (controller.signal.aborted) return;

			if (result.success && result.data) {
				searchResults = result.data.products || [];
				showDropdown = searchResults.length > 0;
				selectedIndex = -1;
			}
		} catch (error) {
			if (controller.signal.aborted) return;

			console.error('Search error:', error);
			searchResults = [];
			showDropdown = false;
		} finally {
			if (activeSearchController === controller) {
				activeSearchController = null;
				isSearching = false;
			}
		}
	}

	// Debounced search handler
	function handleSearch(query: string) {
		clearTimeout(debounceTimer);
		cancelActiveSearch();

		if (query.trim().length < 2) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		debounceTimer = setTimeout(() => {
			performSearch(query);
		}, 200);
	}

	// Handle input changes
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
		handleSearch(searchQuery);
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (!showDropdown || searchResults.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
					selectProduct(searchResults[selectedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				closeDropdown();
				break;
		}
	}

	// Select a product
	function selectProduct(product: CatalogProduct, variant?: CatalogProductVariant) {
		if (onSelect) {
			onSelect(product, variant);
		}
		searchQuery = '';
		closeDropdown();
		searchInput?.focus();
	}

	// Close dropdown
	function closeDropdown() {
		clearTimeout(debounceTimer);
		cancelActiveSearch();
		showDropdown = false;
		selectedIndex = -1;
		searchResults = [];
	}

	// Handle click outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.product-search-container')) {
			closeDropdown();
		}
	}

	// Lifecycle
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
			return () => {
				window.removeEventListener('click', handleClickOutside);
				clearTimeout(debounceTimer);
				cancelActiveSearch();
			};
		}
	});
</script>

<div class="product-search-container relative w-full">
	<div>
		<div>
			<input
				bind:this={searchInput}
				type="text"
				{placeholder}
				class={inputStyles({ full: true })}
				value={searchQuery}
				oninput={handleInput}
				onkeydown={handleKeydown}
				onfocus={() => {
					if (searchResults.length > 0) {
						showDropdown = true;
					}
				}}
			/>
			<span class={buttonStyles({ shape: 'square' })}>
				{#if isSearching}
					<span class={spinnerStyles('sm')}></span>
				{:else}
					<Search class="h-5 w-5" />
				{/if}
			</span>
		</div>
	</div>

	{#if showDropdown && searchResults.length > 0}
		<div
			class="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-surface-strong bg-surface shadow-xl"
		>
			{#each searchResults as product, index (product.id)}
				<div
					class="cursor-pointer border-b border-surface-muted p-3 last:border-b-0 hover:bg-surface-muted {index ===
					selectedIndex
						? 'bg-surface-muted'
						: ''}"
					onclick={() => (showVariants && product.variants?.length ? null : selectProduct(product))}
					onkeydown={(e) => e.key === 'Enter' && selectProduct(product)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-start gap-3">
						<!-- Product Image -->
						<div class="relative inline-flex align-middle">
							<div class="aspect-square h-12 w-12 overflow-hidden rounded-lg bg-surface-muted">
								{#if product.imageUrl}
									<img
										src={product.imageUrl}
										alt={product.name}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full items-center justify-center">
										<Package class="h-6 w-6 opacity-50" />
									</div>
								{/if}
							</div>
						</div>

						<!-- Product Info -->
						<div class="flex-1">
							<div class="font-semibold">{product.name}</div>
							{#if product.description}
								<div class="line-clamp-1 text-sm text-ink/60">{product.description}</div>
							{/if}
							{#if product.category}
								<div class={cx(badgeStyles('ghost', 'sm'), 'mt-1')}>{product.category}</div>
							{/if}

							<!-- Variants -->
							{#if showVariants && product.variants && product.variants.length > 0}
								<div class="mt-2 flex flex-wrap gap-2">
									{#each product.variants as variant (variant.id)}
										{#if variant.stockQuantity > 0}
											<button
												class={buttonStyles({ variant: 'outline', size: 'xs' })}
												onclick={(e) => {
													e.stopPropagation();
													selectProduct(product, variant);
												}}
											>
												<span class="font-medium">{variant.size}</span>
												<span class="text-xs opacity-70">
													{formatIdr(variant.sellingPrice / 100)}
												</span>
												{#if variant.stockQuantity < 10}
													<span class={badgeStyles('caution', 'xs')}>Low</span>
												{/if}
											</button>
										{/if}
									{/each}
								</div>
							{:else if product.variants && product.variants.length > 0}
								<div class="mt-1 text-sm text-ink/60">
									{product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching}
		<div
			class="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border border-surface-strong bg-surface p-4 text-center text-ink/60 shadow-xl"
		>
			No products found for "{searchQuery}"
		</div>
	{/if}
</div>

<style>
	.product-search-container {
		position: relative;
	}

	.line-clamp-1 {
		display: -webkit-box;
		line-clamp: 1;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
