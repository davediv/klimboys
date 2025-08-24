<script lang="ts">
	import { X, Package } from '@lucide/svelte';

	interface Props {
		product: any;
		show: boolean;
		onClose: () => void;
		onSelect: (product: any, variant: any) => void;
	}

	let { product, show, onClose, onSelect }: Props = $props();
	let selectedVariant = $state<any>(null);

	$effect(() => {
		if (show && product?.variants?.length > 0) {
			// Pre-select first available variant
			selectedVariant = product.variants.find((v: any) => v.stockQuantity > 0) || null;
		}
	});

	function handleAddToCart() {
		if (selectedVariant) {
			onSelect(product, selectedVariant);
			onClose();
			selectedVariant = null;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}
</script>

{#if show && product}
	<!-- Modal Backdrop -->
	<button
		class="bg-opacity-50 fixed inset-0 z-40 bg-black"
		onclick={onClose}
		aria-label="Close modal"
	></button>

	<!-- Modal Content -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-4">
				<h3 class="text-lg font-semibold">Select Size</h3>
				<button onclick={onClose} class="btn btn-circle btn-ghost btn-sm">
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Product Info -->
			<div class="p-4">
				<div class="mb-4 flex items-start gap-4">
					{#if product.imageUrl}
						<div class="avatar">
							<div class="h-20 w-20 rounded-lg">
								<img src={product.imageUrl} alt={product.name} />
							</div>
						</div>
					{:else}
						<div class="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
							<Package class="h-10 w-10 text-gray-400" />
						</div>
					{/if}
					<div class="flex-1">
						<h4 class="text-lg font-semibold">{product.name}</h4>
						<p class="text-sm text-gray-600">{product.category}</p>
						{#if product.description}
							<p class="mt-1 text-xs text-gray-500">{product.description}</p>
						{/if}
					</div>
				</div>

				<!-- Size Selection -->
				<div class="space-y-2">
					<p class="text-sm font-medium text-gray-700">Available Sizes:</p>
					<div class="grid grid-cols-3 gap-2">
						{#each product.variants || [] as variant}
							<button
								onclick={() => (selectedVariant = variant)}
								disabled={variant.stockQuantity === 0}
								class="relative rounded-lg border-2 p-3 transition-all {selectedVariant?.id ===
								variant.id
									? 'border-[#FF6B6B] bg-red-50'
									: 'border-gray-200 hover:border-gray-300'} {variant.stockQuantity === 0
									? 'cursor-not-allowed opacity-50'
									: 'cursor-pointer'}"
							>
								<div class="text-center">
									<p class="font-semibold">{variant.size}</p>
									<p class="mt-1 text-xs text-gray-600">
										{formatCurrency(variant.sellingPrice / 100)}
									</p>
									{#if variant.stockQuantity < 10 && variant.stockQuantity > 0}
										<span class="absolute top-1 right-1 badge badge-xs badge-warning">
											{variant.stockQuantity} left
										</span>
									{:else if variant.stockQuantity === 0}
										<span class="absolute top-1 right-1 badge badge-xs badge-error">
											Out of stock
										</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Selected Variant Details -->
				{#if selectedVariant}
					<div class="mt-4 rounded-lg bg-gray-50 p-3">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-gray-600">Selected:</p>
								<p class="font-semibold">
									{product.name} - Size {selectedVariant.size}
								</p>
							</div>
							<p class="text-lg font-bold text-[#FF6B6B]">
								{formatCurrency(selectedVariant.sellingPrice / 100)}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex gap-2 border-t border-gray-200 p-4">
				<button onclick={onClose} class="btn flex-1 btn-ghost"> Cancel </button>
				<button
					onclick={handleAddToCart}
					disabled={!selectedVariant}
					class="btn flex-1 btn-primary"
				>
					Add to Cart
				</button>
			</div>
		</div>
	</div>
{/if}
