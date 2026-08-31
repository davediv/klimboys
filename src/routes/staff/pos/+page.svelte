<script lang="ts">
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { ShoppingCart, Plus, Minus, Trash2, Package, CreditCard } from '@lucide/svelte';
	import ProductSearch from '$lib/components/ProductSearch.svelte';
	import { formatIdr } from '$lib/format';
	import type { PosProduct, PosProductVariant } from '$lib/product';
	import {
		transactionChannels,
		transactionPaymentMethods,
		type CreateTransactionResponse,
		type TransactionReceipt
	} from '$lib/transaction';
	import {
		alertStyles,
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

	interface CartItem {
		id: string;
		productId: string;
		name: string;
		variant: string;
		variantId: string;
		price: number;
		quantity: number;
		stockQuantity: number;
		imageUrl?: string | null;
	}

	interface SavedPosDraft {
		version: 1;
		cart: CartItem[];
		channel: string;
		paymentMethod: string;
		orderNotes: string;
		pendingIdempotencyKey: string | null;
		pendingFingerprint: string | null;
	}

	const POS_DRAFT_KEY = 'klimboys:pos-draft:v1';
	const POS_DRAFT_SAVE_DELAY_MS = 150;
	const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	let cart = $state<CartItem[]>([]);

	let channel = $state('Store');
	let paymentMethod = $state('Cash');
	let orderNotes = $state('');
	let isProcessing = $state(false);
	let checkoutError = $state('');
	let receipt = $state<TransactionReceipt | null>(null);
	let pendingIdempotencyKey: string | null = null;
	let pendingFingerprint: string | null = null;
	let draftSaveTimer: ReturnType<typeof setTimeout> | undefined;
	let draftReady = $state(false);
	let draftRestored = $state(false);
	let popularProducts = $derived(data.popularProducts);
	let total = $derived(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	function isCartItem(value: unknown): value is CartItem {
		if (!isRecord(value)) return false;
		return (
			typeof value.id === 'string' &&
			typeof value.productId === 'string' &&
			typeof value.name === 'string' &&
			typeof value.variant === 'string' &&
			typeof value.variantId === 'string' &&
			Number.isInteger(value.price) &&
			Number(value.price) >= 0 &&
			Number.isInteger(value.quantity) &&
			Number(value.quantity) > 0 &&
			Number.isInteger(value.stockQuantity) &&
			Number(value.stockQuantity) > 0 &&
			(value.imageUrl === undefined ||
				value.imageUrl === null ||
				typeof value.imageUrl === 'string')
		);
	}

	function restoreDraft(value: unknown) {
		if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.cart)) return;
		const restoredCart = value.cart
			.filter(isCartItem)
			.map((item) => ({ ...item, quantity: Math.min(item.quantity, item.stockQuantity) }));
		if (restoredCart.length === 0) return;

		cart = restoredCart;
		if (
			typeof value.channel === 'string' &&
			transactionChannels.some((option) => option === value.channel)
		) {
			channel = value.channel;
		}
		if (
			typeof value.paymentMethod === 'string' &&
			transactionPaymentMethods.some((option) => option === value.paymentMethod)
		) {
			paymentMethod = value.paymentMethod;
		}
		if (typeof value.orderNotes === 'string') orderNotes = value.orderNotes.slice(0, 500);
		pendingIdempotencyKey =
			typeof value.pendingIdempotencyKey === 'string' &&
			UUID_PATTERN.test(value.pendingIdempotencyKey)
				? value.pendingIdempotencyKey
				: null;
		pendingFingerprint =
			typeof value.pendingFingerprint === 'string' ? value.pendingFingerprint : null;
		draftRestored = true;
	}

	function serializeDraft() {
		if (cart.length === 0) return null;
		const draft: SavedPosDraft = {
			version: 1,
			cart,
			channel,
			paymentMethod,
			orderNotes,
			pendingIdempotencyKey,
			pendingFingerprint
		};
		return JSON.stringify(draft);
	}

	function persistDraft(serializedDraft = serializeDraft()) {
		clearTimeout(draftSaveTimer);
		draftSaveTimer = undefined;
		try {
			if (serializedDraft === null) {
				localStorage.removeItem(POS_DRAFT_KEY);
			} else {
				localStorage.setItem(POS_DRAFT_KEY, serializedDraft);
			}
		} catch {
			// Storage can be unavailable in private browsing; checkout remains usable.
		}
	}

	function scheduleDraftSave(serializedDraft: string | null) {
		clearTimeout(draftSaveTimer);
		draftSaveTimer = setTimeout(() => persistDraft(serializedDraft), POS_DRAFT_SAVE_DELAY_MS);
	}

	onMount(() => {
		try {
			const savedDraft = localStorage.getItem(POS_DRAFT_KEY);
			if (savedDraft) restoreDraft(JSON.parse(savedDraft) as unknown);
		} catch {
			try {
				localStorage.removeItem(POS_DRAFT_KEY);
			} catch {
				// Storage may be disabled; the POS remains usable without draft recovery.
			}
		} finally {
			draftReady = true;
		}

		const handleKeyboardShortcut = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && cart.length > 0) {
				event.preventDefault();
				void processTransaction();
			}
		};
		const handlePageHide = () => persistDraft();
		window.addEventListener('keydown', handleKeyboardShortcut);
		window.addEventListener('pagehide', handlePageHide);
		return () => {
			window.removeEventListener('keydown', handleKeyboardShortcut);
			window.removeEventListener('pagehide', handlePageHide);
			clearTimeout(draftSaveTimer);
		};
	});

	$effect(() => {
		if (!draftReady) return;
		scheduleDraftSave(serializeDraft());
	});

	beforeNavigate((navigation) => {
		if (draftReady) persistDraft();
		if (cart.length === 0 || isProcessing) return;
		if (navigation.willUnload) {
			navigation.cancel();
			return;
		}
		if (!window.confirm('Leave this sale? Your draft is saved on this device.')) {
			navigation.cancel();
		}
	});

	function handleProductSelect(product: PosProduct, variant?: PosProductVariant) {
		if (!variant) {
			checkoutError = `Choose an available size for ${product.name}.`;
			return;
		}
		if (variant.stockQuantity < 1) {
			checkoutError = `${product.name} (${variant.size}) is out of stock.`;
			return;
		}

		const cartItemId = `${product.id}-${variant.id}`;
		const existingItem = cart.find((item) => item.id === cartItemId);

		if (existingItem) {
			if (existingItem.quantity >= existingItem.stockQuantity) {
				checkoutError = `Only ${existingItem.stockQuantity} units of ${product.name} (${variant.size}) are available.`;
				return;
			}
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
					stockQuantity: variant.stockQuantity,
					imageUrl: product.imageUrl
				}
			];
		}
		checkoutError = '';
		receipt = null;
	}

	function updateQuantity(itemId: string, delta: number) {
		const item = cart.find((i) => i.id === itemId);
		if (item) {
			item.quantity = Math.min(item.stockQuantity, Math.max(1, item.quantity + delta));
			checkoutError = '';
			receipt = null;
		}
	}

	function removeFromCart(itemId: string) {
		cart = cart.filter((item) => item.id !== itemId);
		checkoutError = '';
		receipt = null;
	}

	async function processTransaction() {
		if (cart.length === 0 || isProcessing) return;

		const requestWithoutKey = {
			channel,
			paymentMethod,
			notes: orderNotes,
			items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
		};
		const fingerprint = JSON.stringify(requestWithoutKey);
		if (!pendingIdempotencyKey || pendingFingerprint !== fingerprint) {
			pendingIdempotencyKey = crypto.randomUUID();
			pendingFingerprint = fingerprint;
		}
		persistDraft();

		isProcessing = true;
		checkoutError = '';
		receipt = null;

		try {
			const response = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					...requestWithoutKey,
					idempotencyKey: pendingIdempotencyKey
				})
			});
			const result = (await response.json()) as CreateTransactionResponse;
			if (!response.ok || !result.success || !result.data) {
				throw new Error(result.error || 'The transaction could not be processed.');
			}

			receipt = result.data;
			cart = [];
			orderNotes = '';
			pendingIdempotencyKey = null;
			pendingFingerprint = null;
			try {
				await invalidateAll();
			} catch (refreshError) {
				console.error(
					'Transaction recorded, but product data could not be refreshed:',
					refreshError
				);
			}
		} catch (error) {
			checkoutError =
				error instanceof Error
					? error.message
					: 'The transaction could not be confirmed. Retry to safely check its status.';
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>Point of Sale - Klimboys</title>
	<meta name="description" content="Create and record an in-store Klimboys sale." />
</svelte:head>

<div class="container mx-auto p-4">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">New Sale</h1>
		{#if data.user}
			<p class="text-ink/70">Welcome back, {data.user.name || data.user.email}</p>
		{/if}
	</div>
	{#if checkoutError}
		<div class={cx(alertStyles('danger'), 'mb-6')} role="alert">{checkoutError}</div>
	{/if}
	{#if draftRestored}
		<div class={cx(alertStyles('caution'), 'mb-6')} role="status">
			A saved sale was restored. Prices and stock will be checked again at checkout.
			<button
				type="button"
				class={buttonStyles({ tone: 'neutral', size: 'sm' })}
				onclick={() => (draftRestored = false)}>Dismiss</button
			>
		</div>
	{/if}
	{#if receipt}
		<div class={cx(alertStyles('positive'), 'mb-6')} role="status">
			<div>
				<p class="font-semibold">Transaction {receipt.transactionCode} recorded</p>
				<p class="text-sm">
					{receipt.itemQuantity} items · {formatIdr(receipt.total / 100)}
					{receipt.alreadyProcessed ? ' · Duplicate submission safely ignored' : ''}
				</p>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
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
					<div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
						{#each popularProducts as product (product.id)}
							{#if product.variants && product.variants.length > 0}
								{#each product.variants as variant (variant.id)}
									{#if variant.stockQuantity > 0}
										<button
											onclick={() => handleProductSelect(product, variant)}
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
		<div class={cx(cardStyles, 'bg-surface shadow-xl md:sticky md:top-4 md:self-start')}>
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
						{#each cart as item (item.id)}
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
												aria-label={`Decrease ${item.name} quantity`}
												disabled={isProcessing}
											>
												<Minus class="h-4 w-4" />
											</button>
											<span class="w-8 text-center font-semibold">{item.quantity}</span>
											<button
												onclick={() => updateQuantity(item.id, 1)}
												class={buttonStyles({ size: 'sm', shape: 'circle' })}
												aria-label={`Increase ${item.name} quantity`}
												disabled={isProcessing || item.quantity >= item.stockQuantity}
											>
												<Plus class="h-4 w-4" />
											</button>
											<button
												onclick={() => removeFromCart(item.id)}
												class={buttonStyles({ tone: 'danger', size: 'sm', shape: 'circle' })}
												aria-label={`Remove ${item.name} from cart`}
												disabled={isProcessing}
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
							<label for="transaction-channel" class="text-sm font-medium text-gray-700">
								Channel
							</label>
							<select
								id="transaction-channel"
								bind:value={channel}
								class={cx(selectStyles({ size: 'sm', full: true }), 'mt-1')}
								disabled={isProcessing}
							>
								{#each transactionChannels as option (option)}
									<option value={option}>{option}</option>
								{/each}
							</select>
						</div>

						<!-- Payment Method -->
						<div>
							<label for="payment-method" class="text-sm font-medium text-gray-700">
								Payment Method
							</label>
							<select
								id="payment-method"
								bind:value={paymentMethod}
								class={cx(selectStyles({ size: 'sm', full: true }), 'mt-1')}
								disabled={isProcessing}
							>
								{#each transactionPaymentMethods as option (option)}
									<option value={option}>{option}</option>
								{/each}
							</select>
						</div>

						<!-- Order Notes -->
						<div>
							<label for="order-notes" class="text-sm font-medium text-gray-700">
								Order Notes
							</label>
							<textarea
								id="order-notes"
								bind:value={orderNotes}
								placeholder="Add any special instructions..."
								class={cx(textareaStyles({ size: 'sm', full: true }), 'mt-1')}
								rows="2"
								maxlength="500"
								disabled={isProcessing}
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
							disabled={cart.length === 0 || isProcessing}
							aria-keyshortcuts="Control+Enter Meta+Enter"
						>
							<CreditCard class="h-5 w-5" />
							{isProcessing ? 'Recording Transaction…' : 'Process Transaction'}
						</button>
						<p class="text-center text-xs text-ink/50">
							Keyboard shortcut: <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
