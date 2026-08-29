<script lang="ts">
	import type { PageData } from './$types';
	import { ShoppingCart, Plus, Minus, Trash2, Package, CreditCard } from '@lucide/svelte';
	import ProductSearch from '$lib/components/ProductSearch.svelte';
	import ProductSizeModal from '$lib/components/ProductSizeModal.svelte';
	import { formatIdr } from '$lib/format';
	import type { CatalogProduct } from '$lib/product';
	import {
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		cardTitleStyles,
		cx,
		dividerStyles,
		selectStyles,
		textareaStyles
	} from '$lib/styles';

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

	// Transaction metadata
	let channel = $state('Store');
	let paymentMethod = $state('Cash');
	let orderNotes = $state('');

	// Modal state
	let showSizeModal = $state(false);
	let selectedProduct = $state<any>(null);

	// Popular products state
	let popularProducts = $state<CatalogProduct[]>(data.popularProducts);

	// Calculate total
	let total = $derived(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

	// Handle product selection from search - show modal if no variant specified
	function handleProductSelect(product: any, variant?: any) {
		if (!variant && product.variants && product.variants.length > 0) {
			// If no variant selected, show the modal for size selection
			showProductModal(product);
			return;
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

	// Add product from popular grid - show size selection modal
	function showProductModal(product: any) {
		selectedProduct = product;
		showSizeModal = true;
	}

	// Handle modal selection
	function handleModalSelect(product: any, variant: any) {
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
		console.log('Processing transaction:', {
			cart,
			total,
			channel,
			paymentMethod,
			orderNotes
		});
		alert('Transaction processed successfully!');
		cart = [];
		orderNotes = '';
	}
</script>

<div class="container mx-auto p-4">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Point of Sale</h1>
		{#if data.user}
			<p class="text-ink/70">Welcome back, {data.user.name || data.user.email}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Product Selection -->
		<div class={cx(cardStyles, 'bg-surface shadow-xl')}>
			<div class={cardBodyStyles}>
				<h2 class={cx(cardTitleStyles, 'mb-4')}>Products</h2>

				<!-- Enhanced Search with Autocomplete -->
				<div class="mb-6">
					<ProductSearch
						onSelect={handleProductSelect}
						placeholder="Search products by name or category..."
						showVariants={true}
					/>
				</div>

				<!-- Popular Products Grid -->
				<div class={dividerStyles}>Popular Products</div>

				{#if popularProducts.length > 0}
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each popularProducts as product}
							{#if product.variants && product.variants.length > 0}
								{#each product.variants as variant}
									{#if variant.stockQuantity > 0}
										<button
											onclick={() => showProductModal(product)}
											class={cx(
												buttonStyles({ variant: 'outline', tone: 'brand', block: true }),
												'!h-auto flex-col gap-1 py-3'
											)}
										>
											{#if product.imageUrl}
												<div class="relative inline-flex align-middle">
													<div class="aspect-square h-12 w-12 overflow-hidden rounded">
														<img
															src={product.imageUrl}
															alt={product.name}
															class="h-full w-full object-cover"
														/>
													</div>
												</div>
											{:else}
												<Package class="h-8 w-8 opacity-50" />
											{/if}
											<span class="text-xs font-bold">{product.name}</span>
											<span class="text-xs opacity-70">Size {variant.size}</span>
											<span class="text-sm font-semibold">
												{formatIdr(variant.sellingPrice / 100)}
											</span>
											{#if variant.stockQuantity < 10}
												<span class={badgeStyles('caution', 'xs')}>Low Stock</span>
											{/if}
										</button>
									{/if}
								{/each}
							{/if}
						{/each}
					</div>
				{:else}
					<div class="py-8 text-center text-ink/50">
						<Package class="mx-auto mb-2 h-12 w-12 opacity-50" />
						<p>No products available</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Shopping Cart -->
		<div class={cx(cardStyles, 'bg-surface shadow-xl')}>
			<div class={cardBodyStyles}>
				<h2 class={cx(cardTitleStyles, 'mb-4')}>
					<ShoppingCart class="h-5 w-5" />
					Shopping Cart
				</h2>

				{#if cart.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-ink/50">
						<ShoppingCart class="mb-4 h-16 w-16" />
						<p>Cart is empty</p>
						<p class="text-sm">Add products to get started</p>
					</div>
				{:else}
					<div class="max-h-96 space-y-3 overflow-y-auto">
						{#each cart as item}
							<div class={cx(cardStyles, 'bg-surface-muted')}>
								<div class={cx(cardBodyStyles, 'p-3')}>
									<div class="flex items-center justify-between">
										<div class="flex flex-1 items-start gap-3">
											{#if item.imageUrl}
												<div class="relative inline-flex align-middle">
													<div class="aspect-square h-10 w-10 overflow-hidden rounded">
														<img
															src={item.imageUrl}
															alt={item.name}
															class="h-full w-full object-cover"
														/>
													</div>
												</div>
											{/if}
											<div class="flex-1">
												<h4 class="font-semibold">{item.name}</h4>
												<p class="text-sm text-ink/70">Size {item.variant}</p>
												<p class="text-sm font-medium">
													{formatIdr(item.price / 100)} each
												</p>
											</div>
										</div>
										<div class="flex items-center gap-2">
											<button
												onclick={() => updateQuantity(item.id, -1)}
												class={buttonStyles({ size: 'sm', shape: 'circle' })}
											>
												<Minus class="h-4 w-4" />
											</button>
											<span class="w-8 text-center font-semibold">{item.quantity}</span>
											<button
												onclick={() => updateQuantity(item.id, 1)}
												class={buttonStyles({ size: 'sm', shape: 'circle' })}
											>
												<Plus class="h-4 w-4" />
											</button>
											<button
												onclick={() => removeFromCart(item.id)}
												class={buttonStyles({ tone: 'danger', size: 'sm', shape: 'circle' })}
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>
									<div class={cx(dividerStyles, 'my-2')}></div>
									<div class="flex justify-between font-semibold">
										<span>Subtotal:</span>
										<span>{formatIdr((item.price * item.quantity) / 100)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<div class={dividerStyles}></div>

					<!-- Transaction Metadata -->
					<div class="space-y-3">
						<!-- Channel Selection -->
						<div>
							<label class="text-sm font-medium text-gray-700">Channel</label>
							<select
								bind:value={channel}
								class={cx(selectStyles({ size: 'sm', full: true }), 'mt-1')}
							>
								<option value="Store">Store</option>
								<option value="GrabFood">GrabFood</option>
								<option value="GoFood">GoFood</option>
								<option value="ShopeeFood">ShopeeFood</option>
								<option value="UberEats">UberEats</option>
							</select>
						</div>

						<!-- Payment Method -->
						<div>
							<label class="text-sm font-medium text-gray-700">Payment Method</label>
							<select
								bind:value={paymentMethod}
								class={cx(selectStyles({ size: 'sm', full: true }), 'mt-1')}
							>
								<option value="Cash">Cash</option>
								<option value="QRIS">QRIS</option>
								<option value="Transfer">Bank Transfer</option>
								<option value="Debit">Debit Card</option>
								<option value="Credit">Credit Card</option>
								<option value="E-Wallet">E-Wallet</option>
							</select>
						</div>

						<!-- Order Notes -->
						<div>
							<label class="text-sm font-medium text-gray-700">Order Notes</label>
							<textarea
								bind:value={orderNotes}
								placeholder="Add any special instructions..."
								class={cx(textareaStyles({ size: 'sm', full: true }), 'mt-1')}
								rows="2"
							></textarea>
						</div>
					</div>

					<div class={dividerStyles}></div>

					<!-- Total and Checkout -->
					<div class="space-y-3">
						<div class="flex justify-between text-xl font-bold">
							<span>Total:</span>
							<span class="text-brand">{formatIdr(total / 100)}</span>
						</div>
						<button
							onclick={processTransaction}
							class={buttonStyles({ tone: 'brand', block: true })}
							disabled={cart.length === 0}
						>
							<CreditCard class="h-5 w-5" />
							Process Transaction
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Product Size Selection Modal -->
<ProductSizeModal
	product={selectedProduct}
	show={showSizeModal}
	onClose={() => {
		showSizeModal = false;
		selectedProduct = null;
	}}
	onSelect={handleModalSelect}
/>
