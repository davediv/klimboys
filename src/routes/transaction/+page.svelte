<script lang="ts">
	import type { PageData } from './$types';
	import { ShoppingCart, Plus, Minus, Trash2, Package } from '@lucide/svelte';
	import ProductSearch from '$lib/components/ProductSearch.svelte';

	let { data }: { data: PageData } = $props();

	// Transaction state
	let cart = $state<
		Array<{
			id: string;
			productId: string;
			name: string;
			variant: string;
			variantId: string;
			price: number;
			quantity: number;
			imageUrl?: string | null;
		}>
	>([]);

	// Popular products state
	let popularProducts = $state<any[]>([]);
	let loadingProducts = $state(false);

	// Calculate total
	let total = $derived(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

	// Fetch popular products on mount
	async function fetchPopularProducts() {
		loadingProducts = true;
		try {
			const response = await fetch('/api/products?limit=6&active=true');
			if (response.ok) {
				const result = (await response.json()) as any;
				if (result.success && result.data) {
					popularProducts = result.data.products || [];
				}
			}
		} catch (error) {
			console.error('Failed to fetch popular products:', error);
		} finally {
			loadingProducts = false;
		}
	}

	// Load popular products on mount
	$effect(() => {
		fetchPopularProducts();
	});

	// Handle product selection from search
	function handleProductSelect(product: any, variant?: any) {
		if (!variant && product.variants && product.variants.length > 0) {
			// If no variant selected but product has variants, use the first available one
			variant = product.variants.find((v: any) => v.stockQuantity > 0);
		}

		if (!variant) {
			console.error('No variant available for product:', product.name);
			return;
		}

		const cartItemId = `${product.id}-${variant.id}`;
		const existingItem = cart.find((item) => item.id === cartItemId);

		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			cart = [
				...cart,
				{
					id: cartItemId,
					productId: product.id,
					name: product.name,
					variant: variant.size,
					variantId: variant.id,
					price: variant.sellingPrice,
					quantity: 1,
					imageUrl: product.imageUrl
				}
			];
		}
	}

	// Add product from popular grid
	function addToCart(product: any, variant: any) {
		handleProductSelect(product, variant);
	}

	function updateQuantity(itemId: string, delta: number) {
		const item = cart.find((i) => i.id === itemId);
		if (item) {
			item.quantity = Math.max(1, item.quantity + delta);
		}
	}

	function removeFromCart(itemId: string) {
		cart = cart.filter((item) => item.id !== itemId);
	}

	function processTransaction() {
		// TODO: Implement transaction processing
		console.log('Processing transaction:', { cart, total });
		alert('Transaction processed successfully!');
		cart = [];
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

<div class="container mx-auto p-4">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Point of Sale</h1>
		{#if data.user}
			<p class="text-base-content/70">Welcome back, {data.user.name || data.user.email}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Product Selection -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title">Products</h2>

				<!-- Enhanced Search with Autocomplete -->
				<div class="mb-6">
					<ProductSearch
						onSelect={handleProductSelect}
						placeholder="Search products by name or category..."
						showVariants={true}
					/>
				</div>

				<!-- Popular Products Grid -->
				<div class="divider">Popular Products</div>

				{#if loadingProducts}
					<div class="flex justify-center py-8">
						<span class="loading loading-lg loading-spinner"></span>
					</div>
				{:else if popularProducts.length > 0}
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each popularProducts as product}
							{#if product.variants && product.variants.length > 0}
								{#each product.variants as variant}
									{#if variant.stockQuantity > 0}
										<button
											onclick={() => addToCart(product, variant)}
											class="btn h-auto btn-block flex-col gap-1 py-3 btn-outline hover:btn-primary"
										>
											{#if product.imageUrl}
												<div class="avatar">
													<div class="h-12 w-12 rounded">
														<img src={product.imageUrl} alt={product.name} />
													</div>
												</div>
											{:else}
												<Package class="h-8 w-8 opacity-50" />
											{/if}
											<span class="text-xs font-bold">{product.name}</span>
											<span class="text-xs opacity-70">Size {variant.size}</span>
											<span class="text-sm font-semibold">
												{formatCurrency(variant.sellingPrice / 100)}
											</span>
											{#if variant.stockQuantity < 10}
												<span class="badge badge-xs badge-warning">Low Stock</span>
											{/if}
										</button>
									{/if}
								{/each}
							{/if}
						{/each}
					</div>
				{:else}
					<div class="py-8 text-center text-base-content/50">
						<Package class="mx-auto mb-2 h-12 w-12 opacity-50" />
						<p>No products available</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Shopping Cart -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title">
					<ShoppingCart class="h-5 w-5" />
					Shopping Cart
				</h2>

				{#if cart.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-base-content/50">
						<ShoppingCart class="mb-4 h-16 w-16" />
						<p>Cart is empty</p>
						<p class="text-sm">Add products to get started</p>
					</div>
				{:else}
					<div class="max-h-96 space-y-3 overflow-y-auto">
						{#each cart as item}
							<div class="card bg-base-200">
								<div class="card-body p-3">
									<div class="flex items-center justify-between">
										<div class="flex flex-1 items-start gap-3">
											{#if item.imageUrl}
												<div class="avatar">
													<div class="h-10 w-10 rounded">
														<img src={item.imageUrl} alt={item.name} />
													</div>
												</div>
											{/if}
											<div class="flex-1">
												<h4 class="font-semibold">{item.name}</h4>
												<p class="text-sm text-base-content/70">Size {item.variant}</p>
												<p class="text-sm font-medium">
													{formatCurrency(item.price / 100)} each
												</p>
											</div>
										</div>
										<div class="flex items-center gap-2">
											<button
												onclick={() => updateQuantity(item.id, -1)}
												class="btn btn-circle btn-sm"
											>
												<Minus class="h-4 w-4" />
											</button>
											<span class="w-8 text-center font-semibold">{item.quantity}</span>
											<button
												onclick={() => updateQuantity(item.id, 1)}
												class="btn btn-circle btn-sm"
											>
												<Plus class="h-4 w-4" />
											</button>
											<button
												onclick={() => removeFromCart(item.id)}
												class="btn btn-circle btn-sm btn-error"
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>
									<div class="divider my-2"></div>
									<div class="flex justify-between font-semibold">
										<span>Subtotal:</span>
										<span>{formatCurrency((item.price * item.quantity) / 100)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<div class="divider"></div>

					<!-- Total and Checkout -->
					<div class="space-y-3">
						<div class="flex justify-between text-xl font-bold">
							<span>Total:</span>
							<span class="text-primary">{formatCurrency(total / 100)}</span>
						</div>
						<button
							onclick={processTransaction}
							class="btn btn-block btn-primary"
							disabled={cart.length === 0}
						>
							Process Transaction
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
