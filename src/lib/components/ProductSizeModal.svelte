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
		class="fixed inset-0 bg-black bg-opacity-50 z-40"
		onclick={onClose}
		aria-label="Close modal"
	></button>

	<!-- Modal Content -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold">Select Size</h3>
				<button onclick={onClose} class="btn btn-ghost btn-sm btn-circle">
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Product Info -->
			<div class="p-4">
				<div class="flex items-start gap-4 mb-4">
					{#if product.imageUrl}
						<div class="avatar">
							<div class="h-20 w-20 rounded-lg">
								<img src={product.imageUrl} alt={product.name} />
							</div>
						</div>
					{:else}
						<div class="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
							<Package class="h-10 w-10 text-gray-400" />
						</div>
					{/if}
					<div class="flex-1">
						<h4 class="font-semibold text-lg">{product.name}</h4>
						<p class="text-sm text-gray-600">{product.category}</p>
						{#if product.description}
							<p class="text-xs text-gray-500 mt-1">{product.description}</p>
						{/if}
					</div>
				</div>

				<!-- Size Selection -->
				<div class="space-y-2">
					<p class="text-sm font-medium text-gray-700">Available Sizes:</p>
					<div class="grid grid-cols-3 gap-2">
						{#each product.variants || [] as variant}
							<button
								onclick={() => selectedVariant = variant}
								disabled={variant.stockQuantity === 0}
								class="relative p-3 rounded-lg border-2 transition-all {
									selectedVariant?.id === variant.id 
										? 'border-[#FF6B6B] bg-red-50' 
										: 'border-gray-200 hover:border-gray-300'
								} {
									variant.stockQuantity === 0 
										? 'opacity-50 cursor-not-allowed' 
										: 'cursor-pointer'
								}"
							>
								<div class="text-center">
									<p class="font-semibold">{variant.size}</p>
									<p class="text-xs text-gray-600 mt-1">
										{formatCurrency(variant.sellingPrice / 100)}
									</p>
									{#if variant.stockQuantity < 10 && variant.stockQuantity > 0}
										<span class="badge badge-xs badge-warning absolute top-1 right-1">
											{variant.stockQuantity} left
										</span>
									{:else if variant.stockQuantity === 0}
										<span class="badge badge-xs badge-error absolute top-1 right-1">
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
					<div class="mt-4 p-3 bg-gray-50 rounded-lg">
						<div class="flex justify-between items-center">
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
			<div class="flex gap-2 p-4 border-t border-gray-200">
				<button onclick={onClose} class="btn btn-ghost flex-1">
					Cancel
				</button>
				<button 
					onclick={handleAddToCart}
					disabled={!selectedVariant}
					class="btn btn-primary flex-1"
				>
					Add to Cart
				</button>
			</div>
		</div>
	</div>
{/if}