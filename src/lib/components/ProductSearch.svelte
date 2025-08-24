<script lang="ts">
	import { Search, Package } from '@lucide/svelte';

	type ProductVariant = {
		id: string;
		size: string;
		sellingPrice: number;
		stockQuantity: number;
	};

	interface Product {
		id: string;
		name: string;
		description?: string;
		category?: string;
		imageUrl?: string | null;
		variants?: ProductVariant[];
	}

	interface Props {
		onSelect?: (product: Product, variant?: ProductVariant) => void;
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
	let searchResults = $state<Product[]>([]);
	let isSearching = $state(false);
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);
	let searchInput: HTMLInputElement;
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Perform search with debouncing
	async function performSearch(query: string) {
		if (query.trim().length < 2) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		isSearching = true;

		try {
			const response = await fetch(
				`${apiEndpoint}?search=${encodeURIComponent(query)}&limit=10&active=true`
			);
			if (!response.ok) {
				throw new Error('Failed to search products');
			}

			const result = (await response.json()) as any;
			if (result.success && result.data) {
				searchResults = result.data.products || [];
				showDropdown = searchResults.length > 0;
				selectedIndex = -1;
			}
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
			showDropdown = false;
		} finally {
			isSearching = false;
		}
	}

	// Debounced search handler
	function handleSearch(query: string) {
		clearTimeout(debounceTimer);
		if (query.trim().length === 0) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		debounceTimer = setTimeout(() => {
			performSearch(query);
		}, 300); // 300ms debounce delay
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
	function selectProduct(product: Product, variant?: ProductVariant) {
		if (onSelect) {
			onSelect(product, variant);
		}
		searchQuery = '';
		closeDropdown();
		searchInput?.focus();
	}

	// Close dropdown
	function closeDropdown() {
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

	// Format price
	function formatPrice(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	// Lifecycle
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
			return () => {
				window.removeEventListener('click', handleClickOutside);
				clearTimeout(debounceTimer);
			};
		}
	});
</script>

<div class="product-search-container relative w-full">
	<div class="form-control">
		<div class="input-group">
			<input
				bind:this={searchInput}
				type="text"
				{placeholder}
				class="input-bordered input w-full"
				value={searchQuery}
				oninput={handleInput}
				onkeydown={handleKeydown}
				onfocus={() => {
					if (searchResults.length > 0) {
						showDropdown = true;
					}
				}}
			/>
			<span class="btn btn-square">
				{#if isSearching}
					<span class="loading loading-sm loading-spinner"></span>
				{:else}
					<Search class="h-5 w-5" />
				{/if}
			</span>
		</div>
	</div>

	{#if showDropdown && searchResults.length > 0}
		<div
			class="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-xl"
		>
			{#each searchResults as product, index}
				<div
					class="cursor-pointer border-b border-base-200 p-3 last:border-b-0 hover:bg-base-200 {index ===
					selectedIndex
						? 'bg-base-200'
						: ''}"
					onclick={() => (showVariants && product.variants?.length ? null : selectProduct(product))}
					onkeydown={(e) => e.key === 'Enter' && selectProduct(product)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-start gap-3">
						<!-- Product Image -->
						<div class="avatar">
							<div class="h-12 w-12 rounded-lg bg-base-200">
								{#if product.imageUrl}
									<img src={product.imageUrl} alt={product.name} class="object-cover" />
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
								<div class="line-clamp-1 text-sm text-base-content/60">{product.description}</div>
							{/if}
							{#if product.category}
								<div class="mt-1 badge badge-ghost badge-sm">{product.category}</div>
							{/if}

							<!-- Variants -->
							{#if showVariants && product.variants && product.variants.length > 0}
								<div class="mt-2 flex flex-wrap gap-2">
									{#each product.variants as variant}
										{#if variant.stockQuantity > 0}
											<button
												class="btn btn-outline btn-xs"
												onclick={(e) => {
													e.stopPropagation();
													selectProduct(product, variant);
												}}
											>
												<span class="font-medium">{variant.size}</span>
												<span class="text-xs opacity-70">
													{formatPrice(variant.sellingPrice / 100)}
												</span>
												{#if variant.stockQuantity < 10}
													<span class="badge badge-xs badge-warning">Low</span>
												{/if}
											</button>
										{/if}
									{/each}
								</div>
							{:else if product.variants && product.variants.length > 0}
								<div class="mt-1 text-sm text-base-content/60">
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
			class="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border border-base-300 bg-base-100 p-4 text-center text-base-content/60 shadow-xl"
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
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
