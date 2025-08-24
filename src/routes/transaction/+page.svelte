<script lang="ts">
	import type { PageData } from './$types';
	import { ShoppingCart, Search, Plus, Minus, Trash2 } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Transaction state
	let searchQuery = $state('');
	let cart = $state<
		Array<{
			id: string;
			name: string;
			variant: string;
			price: number;
			quantity: number;
		}>
	>([]);

	// Calculate total
	let total = $derived(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

	// Mock products for now - will be replaced with API call
	let products = $state([
		{ id: '1', name: 'Vanilla Shake', variant: 'Regular', price: 4500 },
		{ id: '2', name: 'Chocolate Shake', variant: 'Large', price: 6500 },
		{ id: '3', name: 'Strawberry Shake', variant: 'Regular', price: 5000 }
	]);

	let filteredProducts = $derived(
		products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function addToCart(product: (typeof products)[0]) {
		const existingItem = cart.find((item) => item.id === product.id);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			cart = [
				...cart,
				{
					...product,
					quantity: 1
				}
			];
		}
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

				<!-- Search -->
				<div class="form-control mb-4">
					<div class="input-group">
						<input
							type="text"
							placeholder="Search products..."
							class="input-bordered input w-full"
							bind:value={searchQuery}
						/>
						<span class="btn btn-square">
							<Search class="h-5 w-5" />
						</span>
					</div>
				</div>

				<!-- Product Grid -->
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each filteredProducts as product}
						<button
							onclick={() => addToCart(product)}
							class="btn h-auto btn-block flex-col gap-1 py-4 btn-outline"
						>
							<ShoppingCart class="h-6 w-6" />
							<span class="text-xs font-bold">{product.name}</span>
							<span class="text-xs opacity-70">{product.variant}</span>
							<span class="text-sm font-semibold">
								${(product.price / 100).toFixed(2)}
							</span>
						</button>
					{/each}
				</div>

				{#if filteredProducts.length === 0}
					<div class="py-8 text-center text-base-content/50">No products found</div>
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
										<div class="flex-1">
											<h4 class="font-semibold">{item.name}</h4>
											<p class="text-sm text-base-content/70">{item.variant}</p>
											<p class="text-sm font-medium">
												${(item.price / 100).toFixed(2)} each
											</p>
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
										<span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
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
							<span class="text-primary">${(total / 100).toFixed(2)}</span>
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
