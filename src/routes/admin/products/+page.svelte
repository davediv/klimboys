<script lang="ts">
	import type { PageData } from './$types';
	import { Package, Plus, Edit, Trash2, Search, X, Save, AlertCircle } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedProduct = $state<any>(null);

	// Form states for add/edit
	let formData = $state({
		name: '',
		description: '',
		category: '',
		imageUrl: '',
		variants: [
			{ size: 'Regular', volumeMl: 250, costPrice: 0, sellingPrice: 0, stockQuantity: 0 },
			{ size: 'Large', volumeMl: 500, costPrice: 0, sellingPrice: 0, stockQuantity: 0 }
		]
	});

	// Mock products for now - will be replaced with API call
	let products = $state([
		{
			id: '1',
			name: 'Vanilla Shake',
			category: 'Classic',
			description: 'Smooth vanilla shake made with premium vanilla',
			imageUrl: '',
			isActive: true,
			variants: [
				{ size: 'Regular', volumeMl: 250, costPrice: 2500, sellingPrice: 4500, stockQuantity: 50 },
				{ size: 'Large', volumeMl: 500, costPrice: 4000, sellingPrice: 6500, stockQuantity: 30 }
			]
		},
		{
			id: '2',
			name: 'Chocolate Shake',
			category: 'Classic',
			description: 'Rich chocolate shake with Belgian chocolate',
			imageUrl: '',
			isActive: true,
			variants: [
				{ size: 'Regular', volumeMl: 250, costPrice: 3000, sellingPrice: 5000, stockQuantity: 45 },
				{ size: 'Large', volumeMl: 500, costPrice: 4500, sellingPrice: 7000, stockQuantity: 25 }
			]
		},
		{
			id: '3',
			name: 'Strawberry Shake',
			category: 'Fruity',
			description: 'Fresh strawberry shake with real fruit',
			imageUrl: '',
			isActive: true,
			variants: [
				{ size: 'Regular', volumeMl: 250, costPrice: 2800, sellingPrice: 4800, stockQuantity: 40 },
				{ size: 'Large', volumeMl: 500, costPrice: 4200, sellingPrice: 6800, stockQuantity: 20 }
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

	// Categories for dropdown
	const categories = ['Classic', 'Fruity', 'Special', 'Seasonal'];

	function openAddModal() {
		formData = {
			name: '',
			description: '',
			category: 'Classic',
			imageUrl: '',
			variants: [
				{ size: 'Regular', volumeMl: 250, costPrice: 0, sellingPrice: 0, stockQuantity: 0 },
				{ size: 'Large', volumeMl: 500, costPrice: 0, sellingPrice: 0, stockQuantity: 0 }
			]
		};
		showAddModal = true;
	}

	function openEditModal(product: any) {
		selectedProduct = product;
		formData = {
			name: product.name,
			description: product.description,
			category: product.category,
			imageUrl: product.imageUrl || '',
			variants: [...product.variants]
		};
		showEditModal = true;
	}

	function openDeleteModal(product: any) {
		selectedProduct = product;
		showDeleteModal = true;
	}

	function handleAddProduct() {
		// TODO: Call API to add product
		const newProduct = {
			id: String(products.length + 1),
			...formData,
			isActive: true
		};
		products = [...products, newProduct];
		showAddModal = false;
	}

	function handleEditProduct() {
		// TODO: Call API to update product
		if (selectedProduct) {
			const index = products.findIndex((p) => p.id === selectedProduct.id);
			if (index !== -1) {
				products[index] = {
					...products[index],
					...formData
				};
			}
		}
		showEditModal = false;
	}

	function handleDeleteProduct() {
		// TODO: Call API to delete product
		if (selectedProduct) {
			products = products.filter((p) => p.id !== selectedProduct.id);
		}
		showDeleteModal = false;
	}

	function toggleProductStatus(productId: string) {
		// TODO: Call API to toggle status
		const product = products.find((p) => p.id === productId);
		if (product) {
			product.isActive = !product.isActive;
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

<div class="container mx-auto p-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Product Management</h1>
			<p class="text-base-content/70">Manage your product catalog</p>
		</div>
		<button class="btn btn-primary" onclick={openAddModal}>
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
						placeholder="Search products by name or category..."
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
							<th>Variants & Pricing</th>
							<th>Stock</th>
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
												{#if product.imageUrl}
													<img src={product.imageUrl} alt={product.name} />
												{:else}
													<Package class="m-auto mt-2 h-8 w-8" />
												{/if}
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
									<div class="space-y-1 text-sm">
										{#each product.variants as variant}
											<div>
												<span class="font-medium">{variant.size}</span>
												<span class="text-xs opacity-70">({variant.volumeMl}ml)</span>:
												{formatCurrency(variant.sellingPrice)}
											</div>
										{/each}
									</div>
								</td>
								<td>
									<div class="space-y-1 text-sm">
										{#each product.variants as variant}
											<div class="flex items-center gap-2">
												<span class="font-medium">{variant.size}:</span>
												<span
													class="badge {variant.stockQuantity < 10
														? 'badge-error'
														: variant.stockQuantity < 20
															? 'badge-warning'
															: 'badge-success'} badge-sm"
												>
													{variant.stockQuantity}
												</span>
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
										<button class="btn btn-ghost btn-xs" onclick={() => openEditModal(product)}>
											<Edit class="h-4 w-4" />
										</button>
										<button
											class="btn text-error btn-ghost btn-xs"
											onclick={() => openDeleteModal(product)}
										>
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

<!-- Add Product Modal -->
{#if showAddModal}
	<div class="modal-open modal">
		<div class="modal-box max-w-3xl">
			<h3 class="mb-4 text-lg font-bold">Add New Product</h3>

			<div class="space-y-4">
				<!-- Basic Info -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Product Name</span>
					</label>
					<input
						type="text"
						placeholder="Enter product name"
						class="input-bordered input"
						bind:value={formData.name}
					/>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text">Description</span>
					</label>
					<textarea
						placeholder="Enter product description"
						class="textarea-bordered textarea"
						bind:value={formData.description}
					></textarea>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text">Category</span>
					</label>
					<select class="select-bordered select" bind:value={formData.category}>
						{#each categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>

				<!-- Variants -->
				<div class="divider">Variants & Pricing</div>
				{#each formData.variants as variant, i}
					<div class="card bg-base-200">
						<div class="card-body p-4">
							<h4 class="font-semibold">{variant.size} Size</h4>
							<div class="grid grid-cols-2 gap-4">
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Volume (ml)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.volumeMl}
									/>
								</div>
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Stock Quantity</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.stockQuantity}
									/>
								</div>
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Cost Price (IDR)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.costPrice}
									/>
								</div>
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Selling Price (IDR)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.sellingPrice}
									/>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showAddModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={handleAddProduct}>
					<Save class="h-4 w-4" />
					Add Product
				</button>
			</div>
		</div>
		<button class="modal-backdrop" onclick={() => (showAddModal = false)} aria-label="Close modal"
		></button>
	</div>
{/if}

<!-- Edit Product Modal -->
{#if showEditModal}
	<div class="modal-open modal">
		<div class="modal-box max-w-3xl">
			<h3 class="mb-4 text-lg font-bold">Edit Product</h3>

			<div class="space-y-4">
				<!-- Basic Info -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Product Name</span>
					</label>
					<input
						type="text"
						placeholder="Enter product name"
						class="input-bordered input"
						bind:value={formData.name}
					/>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text">Description</span>
					</label>
					<textarea
						placeholder="Enter product description"
						class="textarea-bordered textarea"
						bind:value={formData.description}
					></textarea>
				</div>

				<div class="form-control">
					<label class="label">
						<span class="label-text">Category</span>
					</label>
					<select class="select-bordered select" bind:value={formData.category}>
						{#each categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>

				<!-- Variants -->
				<div class="divider">Variants & Pricing</div>
				{#each formData.variants as variant, i}
					<div class="card bg-base-200">
						<div class="card-body p-4">
							<h4 class="font-semibold">{variant.size} Size</h4>
							<div class="grid grid-cols-2 gap-4">
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Volume (ml)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.volumeMl}
									/>
								</div>
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Stock Quantity</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.stockQuantity}
									/>
								</div>
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Cost Price (IDR)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.costPrice}
									/>
								</div>
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Selling Price (IDR)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.sellingPrice}
									/>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showEditModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={handleEditProduct}>
					<Save class="h-4 w-4" />
					Save Changes
				</button>
			</div>
		</div>
		<button class="modal-backdrop" onclick={() => (showEditModal = false)} aria-label="Close modal"
		></button>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Delete Product</h3>

			<div class="mb-4 alert alert-warning">
				<AlertCircle class="h-6 w-6" />
				<span>This action cannot be undone. The product will be permanently deleted.</span>
			</div>

			{#if selectedProduct}
				<p class="mb-4">
					Are you sure you want to delete <strong>{selectedProduct.name}</strong>?
				</p>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showDeleteModal = false)}>Cancel</button>
				<button class="btn btn-error" onclick={handleDeleteProduct}>
					<Trash2 class="h-4 w-4" />
					Delete Product
				</button>
			</div>
		</div>
		<button
			class="modal-backdrop"
			onclick={() => (showDeleteModal = false)}
			aria-label="Close modal"
		></button>
	</div>
{/if}
