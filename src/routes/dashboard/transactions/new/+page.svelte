<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import {
		ShoppingCart,
		Plus,
		Minus,
		X,
		CreditCard,
		Banknote,
		Smartphone,
		Store,
		Tag
	} from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type CartItem = {
		productId: string;
		product: (typeof data.products)[0];
		quantity: number;
		price: number;
		subtotal: number;
	};

	let cart = $state<CartItem[]>([]);
	let selectedCategory = $state<string | null>(null);
	let channel = $state<string>('store');
	let paymentMethod = $state<string>('cash');
	let selectedCustomerId = $state<string | undefined>(undefined);
	let notes = $state('');
	let loading = $state(false);

	const channels = [
		{ value: 'store', label: 'Store', icon: Store },
		{ value: 'grabfood', label: 'GrabFood', emoji: '🟢' },
		{ value: 'gofood', label: 'GoFood', emoji: '🔴' },
		{ value: 'shopeefood', label: 'ShopeeFood', emoji: '🟠' },
		{ value: 'ubereats', label: 'UberEats', emoji: '⚫' }
	];

	const paymentMethods = [
		{ value: 'cash', label: 'Cash', icon: Banknote },
		{ value: 'qris', label: 'QRIS', icon: Smartphone },
		{ value: 'debit_card', label: 'Debit Card', icon: CreditCard },
		{ value: 'credit_card', label: 'Credit Card', icon: CreditCard }
	];

	// Add delivery platform payment methods based on channel
	$effect(() => {
		if (channel !== 'store') {
			paymentMethod = channel;
		}
	});

	const filteredProducts = $derived(
		selectedCategory
			? data.products.filter((p) => p.categoryId === selectedCategory)
			: data.products
	);

	const totalAmount = $derived(cart.reduce((sum, item) => sum + item.subtotal, 0));

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	// Handle image error by showing placeholder
	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.src = 'https://via.placeholder.com/400x300?text=Product+Image';
	}

	function addToCart(product: (typeof data.products)[0]) {
		if (!product.id || product.sellingPrice === undefined) return;

		const existingItem = cart.find((item) => item.productId === product.id);

		if (existingItem) {
			existingItem.quantity++;
			existingItem.subtotal = existingItem.price * existingItem.quantity;
		} else {
			cart.push({
				productId: product.id,
				product,
				quantity: 1,
				price: product.sellingPrice,
				subtotal: product.sellingPrice
			});
		}
		cart = cart;
	}

	function updateQuantity(index: number, delta: number) {
		const item = cart[index];
		item.quantity = Math.max(1, item.quantity + delta);
		item.subtotal = item.price * item.quantity;
		cart = cart;
	}

	function removeFromCart(index: number) {
		cart.splice(index, 1);
		cart = cart;
	}

	function clearCart() {
		cart = [];
	}
</script>

<svelte:head>
	<title>New Transaction - Klimboys POS</title>
</svelte:head>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Product Selection -->
	<div class="space-y-4">
		<div>
			<h1 class="text-2xl font-bold">New Transaction</h1>
			<p class="text-base-content/70">Select products to add to cart</p>
		</div>

		<!-- Category Filter -->
		<div class="flex flex-wrap gap-2">
			<Button
				size="sm"
				variant={selectedCategory === null ? 'primary' : 'ghost'}
				onclick={() => (selectedCategory = null)}
			>
				All
			</Button>
			{#each data.categories as category}
				<Button
					size="sm"
					variant={selectedCategory === category.id ? 'primary' : 'ghost'}
					onclick={() => (selectedCategory = category.id)}
				>
					{category.name}
				</Button>
			{/each}
		</div>

		<!-- Product Grid -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
			{#each filteredProducts as product}
				<button
					class="card bg-base-100 cursor-pointer shadow-sm transition-shadow hover:shadow-md"
					onclick={() => addToCart(product)}
				>
					{#if product.imageUrl}
						<figure class="aspect-square">
							<img
								src={`/api/images/${product.imageUrl}`}
								alt={product.title}
								class="h-full w-full object-cover"
								onerror={handleImageError}
							/>
						</figure>
					{:else}
						<figure class="bg-base-200 flex aspect-square items-center justify-center">
							<Tag class="text-base-content/30 h-12 w-12" />
						</figure>
					{/if}
					<div class="card-body p-3">
						<h3 class="line-clamp-2 text-sm font-semibold">{product.title}</h3>
						<p class="text-base-content/70 text-xs">{product.size || 0}ml</p>
						<p class="text-primary font-bold">{formatCurrency(product.sellingPrice || 0)}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Shopping Cart -->
	<div class="space-y-4">
		<div class="bg-base-100 rounded-box space-y-4 p-4 shadow">
			<div class="flex items-center justify-between">
				<h2 class="flex items-center gap-2 text-xl font-bold">
					<ShoppingCart class="h-5 w-5" />
					Shopping Cart
				</h2>
				{#if cart.length > 0}
					<Button size="sm" variant="ghost" onclick={clearCart}>Clear</Button>
				{/if}
			</div>

			<!-- Cart Items -->
			<div class="max-h-96 space-y-2 overflow-y-auto">
				{#each cart as item, index}
					<div class="bg-base-200 flex items-center gap-3 rounded-lg p-3">
						<div class="flex-1">
							<h4 class="font-medium">{item.product.title}</h4>
							<p class="text-base-content/70 text-sm">
								{formatCurrency(item.price)} × {item.quantity}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<Button
								size="sm"
								square
								variant="ghost"
								icon={Minus}
								onclick={() => updateQuantity(index, -1)}
								disabled={item.quantity <= 1}
							/>
							<span class="w-8 text-center font-medium">{item.quantity}</span>
							<Button
								size="sm"
								square
								variant="ghost"
								icon={Plus}
								onclick={() => updateQuantity(index, 1)}
							/>
							<Button
								size="sm"
								square
								variant="ghost"
								icon={X}
								onclick={() => removeFromCart(index)}
							/>
						</div>
						<div class="text-right">
							<p class="font-semibold">{formatCurrency(item.subtotal)}</p>
						</div>
					</div>
				{:else}
					<p class="text-center text-base-content/50 py-8">
						Cart is empty. Select products to add.
					</p>
				{/each}
			</div>

			<!-- Transaction Details -->
			{#if cart.length > 0}
				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						loading = true;
						return async ({ result }) => {
							loading = false;
							if (result.type === 'redirect') {
								notifications.success('Transaction created', 'The transaction has been recorded');
							} else if (result.type === 'failure' && result.data?.message) {
								notifications.error('Transaction failed', String(result.data.message));
							}
						};
					}}
				>
					<!-- Hidden cart items -->
					{#each cart as item, index}
						<input type="hidden" name={`items[${index}][productId]`} value={item.productId} />
						<input type="hidden" name={`items[${index}][quantity]`} value={item.quantity} />
						<input type="hidden" name={`items[${index}][price]`} value={item.price} />
						<input type="hidden" name={`items[${index}][subtotal]`} value={item.subtotal} />
					{/each}
					<input type="hidden" name="totalAmount" value={totalAmount} />

					<div class="divider"></div>

					<!-- Channel Selection -->
					<div class="form-control">
						<label class="label">
							<span class="label-text">Sales Channel</span>
						</label>
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{#each channels as ch}
								<label class="cursor-pointer">
									<input
										type="radio"
										name="channel"
										value={ch.value}
										bind:group={channel}
										class="sr-only"
									/>
									<div
										class="btn btn-sm {channel === ch.value ? 'btn-primary' : 'btn-ghost'} w-full"
									>
										{#if ch.icon}
											<svelte:component this={ch.icon} class="h-4 w-4" />
										{:else if ch.emoji}
											<span>{ch.emoji}</span>
										{/if}
										{ch.label}
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Payment Method -->
					{#if channel === 'store'}
						<div class="form-control">
							<label class="label">
								<span class="label-text">Payment Method</span>
							</label>
							<div class="grid grid-cols-2 gap-2">
								{#each paymentMethods as pm}
									<label class="cursor-pointer">
										<input
											type="radio"
											name="paymentMethod"
											value={pm.value}
											bind:group={paymentMethod}
											class="sr-only"
										/>
										<div
											class="btn btn-sm {paymentMethod === pm.value
												? 'btn-primary'
												: 'btn-ghost'} w-full"
										>
											<svelte:component this={pm.icon} class="h-4 w-4" />
											{pm.label}
										</div>
									</label>
								{/each}
							</div>
						</div>
					{:else}
						<input type="hidden" name="paymentMethod" value={channel} />
					{/if}

					<!-- Customer Selection -->
					<div class="form-control">
						<label class="label" for="customer">
							<span class="label-text">Customer (optional)</span>
						</label>
						<select
							id="customer"
							name="customerId"
							class="select select-bordered"
							bind:value={selectedCustomerId}
						>
							<option value="">Walk-in Customer</option>
							{#each data.customers as customer}
								<option value={customer.id}>{customer.name}</option>
							{/each}
						</select>
					</div>

					<!-- Notes -->
					<div class="form-control">
						<label class="label" for="notes">
							<span class="label-text">Notes (optional)</span>
						</label>
						<textarea
							id="notes"
							name="notes"
							class="textarea textarea-bordered"
							rows="2"
							bind:value={notes}
						></textarea>
					</div>

					<!-- Total -->
					<div class="bg-base-200 rounded-lg p-4">
						<div class="flex items-center justify-between">
							<span class="text-lg">Total Amount</span>
							<span class="text-primary text-2xl font-bold">{formatCurrency(totalAmount)}</span>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex gap-2">
						<Button href="/dashboard/transactions" variant="ghost" class="flex-1">Cancel</Button>
						<Button
							type="submit"
							variant="primary"
							class="flex-1"
							{loading}
							loadingText="Processing..."
						>
							Complete Transaction
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
