<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import { Plus, Trash2, Save, Package, FlaskConical } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedProductId = $state<string | null>(null);
	let recipeItems = $state<{ inventoryId: string; quantity: number }[]>([]);
	let loading = $state(false);

	$effect(() => {
		if (selectedProductId) {
			const product = data.products.find((p) => p.id === selectedProductId);
			if (product?.recipes && product.recipes.length > 0) {
				recipeItems = product.recipes.map((r) => ({
					inventoryId: r.inventoryId,
					quantity: r.quantity
				}));
			} else {
				recipeItems = [{ inventoryId: '', quantity: 0 }];
			}
		}
	});

	function addIngredient() {
		recipeItems = [...recipeItems, { inventoryId: '', quantity: 0 }];
	}

	function removeIngredient(index: number) {
		recipeItems = recipeItems.filter((_, i) => i !== index);
	}

	function hasRecipe(productId: string) {
		const product = data.products.find((p) => p.id === productId);
		return product?.recipes && product.recipes.length > 0;
	}
</script>

<svelte:head>
	<title>Product Recipes - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">Product Recipes</h1>
			<p class="text-base-content/70 mt-1">
				Define ingredients needed for each product to track inventory usage
			</p>
		</div>
		<Button variant="ghost" href="/dashboard/inventory" icon={Package}>View Inventory</Button>
	</div>

	<!-- Product Selection -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<div class="form-control">
			<label class="label" for="product-select">
				<span class="label-text text-lg font-semibold">Select Product</span>
			</label>
			<select
				id="product-select"
				class="select select-bordered select-lg"
				bind:value={selectedProductId}
			>
				<option value={null}>Choose a product...</option>
				{#each data.products as product}
					<option value={product.id}>
						{product.title}
						{hasRecipe(product.id) ? '✓' : ''}
						- {product.category?.name || 'Uncategorized'}
					</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Recipe Editor -->
	{#if selectedProductId}
		{@const selectedProduct = data.products.find((p) => p.id === selectedProductId)}
		<div class="bg-base-100 rounded-box p-6 shadow">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">
					Recipe for {selectedProduct?.title}
				</h2>
				{#if hasRecipe(selectedProductId)}
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success') {
									notifications.success('Recipe deleted', 'Product recipe has been removed');
									await update();
								}
							};
						}}
					>
						<input type="hidden" name="productId" value={selectedProductId} />
						<Button
							type="submit"
							size="sm"
							variant="error"
							onclick={(e) => {
								if (!confirm('Are you sure you want to delete this recipe?')) {
									e.preventDefault();
								}
							}}
						>
							Delete Recipe
						</Button>
					</form>
				{/if}
			</div>

			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Recipe saved', 'Product recipe has been updated');
							await update();
						} else if (result.type === 'failure' && result.data?.message) {
							notifications.error('Save failed', result.data.message);
						}
					};
				}}
			>
				<input type="hidden" name="productId" value={selectedProductId} />

				<div class="space-y-4">
					<div class="text-base-content/70 text-sm">
						Define the ingredients and quantities needed to make one {selectedProduct?.size}ml of{' '}
						{selectedProduct?.title}
					</div>

					<!-- Recipe Items -->
					{#each recipeItems as item, index}
						<div class="flex gap-2">
							<div class="form-control flex-1">
								<select
									name={`items[${index}][inventoryId]`}
									class="select select-bordered"
									bind:value={item.inventoryId}
									required
								>
									<option value="">Select ingredient...</option>
									{#each data.inventoryItems as inv}
										<option value={inv.id}>{inv.name} ({inv.unit})</option>
									{/each}
								</select>
							</div>
							<div class="form-control w-32">
								<input
									name={`items[${index}][quantity]`}
									type="number"
									step="0.01"
									min="0"
									class="input input-bordered"
									placeholder="Qty"
									bind:value={item.quantity}
									required
								/>
							</div>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								square
								icon={Trash2}
								onclick={() => removeIngredient(index)}
								disabled={recipeItems.length === 1}
							/>
						</div>
					{/each}

					<Button type="button" variant="ghost" icon={Plus} onclick={addIngredient}>
						Add Ingredient
					</Button>
				</div>

				<div class="mt-6 flex justify-end gap-2">
					<Button
						type="button"
						variant="ghost"
						onclick={() => {
							selectedProductId = null;
							recipeItems = [];
						}}
					>
						Cancel
					</Button>
					<Button type="submit" variant="primary" icon={Save} {loading} loadingText="Saving...">
						Save Recipe
					</Button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Products with Recipes -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<h2 class="mb-4 text-xl font-bold">Products with Recipes</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each data.products.filter((p) => p.recipes && p.recipes.length > 0) as product}
				<div class="border-base-300 rounded-lg border p-4">
					<div class="mb-2 flex items-start justify-between">
						<div>
							<h3 class="font-semibold">{product.title}</h3>
							<p class="text-base-content/70 text-sm">
								{product.size}ml • {product.category?.name || 'Uncategorized'}
							</p>
						</div>
						<button class="btn btn-ghost btn-sm" onclick={() => (selectedProductId = product.id)}>
							Edit
						</button>
					</div>
					<div class="space-y-1">
						{#each product.recipes as recipe}
							<div class="flex items-center gap-2 text-sm">
								<FlaskConical class="text-base-content/50 h-4 w-4" />
								<span>{recipe.inventory?.name}: {recipe.quantity} {recipe.inventory?.unit}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="col-span-2 py-8 text-center text-base-content/50">
					No products have recipes yet. Select a product above to define its ingredients.
				</div>
			{/each}
		</div>
	</div>
</div>
