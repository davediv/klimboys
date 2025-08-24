<script lang="ts">
	import type { PageData } from './$types';
	import { Package, Plus, Edit, Trash2, Search } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	// Mock products for now - will be replaced with API call
	let products = $state([
		{
			id: '1',
			name: 'Vanilla Shake',
			category: 'Classic',
			description: 'Smooth vanilla shake',
			isActive: true,
			variants: [
				{ size: 'Regular', price: 4500 },
				{ size: 'Large', price: 6500 }
			]
		},
		{
			id: '2',
			name: 'Chocolate Shake',
			category: 'Classic',
			description: 'Rich chocolate shake',
			isActive: true,
			variants: [
				{ size: 'Regular', price: 5000 },
				{ size: 'Large', price: 7000 }
			]
		}
	]);

	let filteredProducts = $derived(
		products.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.category.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function toggleProductStatus(productId: string) {
		const product = products.find((p) => p.id === productId);
		if (product) {
			product.isActive = !product.isActive;
		}
	}
</script>

<div class="container mx-auto p-4">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Product Management</h1>
			<p class="text-base-content/70">Manage your product catalog</p>
		</div>
		<button class="btn btn-primary">
			<Plus class="h-5 w-5" />
			Add Product
		</button>
	</div>

	<!-- Search and Filter -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="form-control">
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
		</div>
	</div>

	<!-- Products Table -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Product</th>
							<th>Category</th>
							<th>Variants</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredProducts as product}
							<tr>
								<td>
									<div class="flex items-center space-x-3">
										<div class="avatar">
											<div class="mask h-12 w-12 bg-base-200 mask-squircle">
												<Package class="m-auto mt-2 h-8 w-8" />
											</div>
										</div>
										<div>
											<div class="font-bold">{product.name}</div>
											<div class="text-sm opacity-50">{product.description}</div>
										</div>
									</div>
								</td>
								<td>{product.category}</td>
								<td>
									<div class="text-sm">
										{#each product.variants as variant}
											<div>
												{variant.size}: ${(variant.price / 100).toFixed(2)}
											</div>
										{/each}
									</div>
								</td>
								<td>
									<button
										onclick={() => toggleProductStatus(product.id)}
										class="badge {product.isActive
											? 'badge-success'
											: 'badge-error'} cursor-pointer"
									>
										{product.isActive ? 'Active' : 'Inactive'}
									</button>
								</td>
								<td>
									<div class="flex gap-2">
										<button class="btn btn-ghost btn-xs">
											<Edit class="h-4 w-4" />
										</button>
										<button class="btn text-error btn-ghost btn-xs">
											<Trash2 class="h-4 w-4" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				{#if filteredProducts.length === 0}
					<div class="py-8 text-center text-base-content/50">No products found</div>
				{/if}
			</div>
		</div>
	</div>
</div>
