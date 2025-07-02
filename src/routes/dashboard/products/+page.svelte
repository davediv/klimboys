<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import { Plus, Edit2, Trash2, Package, ImageOff, DollarSign } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';

	export let data: PageData;

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedProduct = $state<typeof data.products[0] | null>(null);
	let loading = $state(false);
	let imagePreview = $state<string | null>(null);
	let editImagePreview = $state<string | null>(null);

	function openEditModal(product: typeof data.products[0]) {
		selectedProduct = product;
		editImagePreview = null;
		showEditModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		selectedProduct = null;
		imagePreview = null;
		editImagePreview = null;
	}

	function handleImageChange(event: Event, isEdit = false) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (isEdit) {
					editImagePreview = e.target?.result as string;
				} else {
					imagePreview = e.target?.result as string;
				}
			};
			reader.readAsDataURL(file);
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function calculateMargin(cost: number, price: number) {
		return ((price - cost) / price * 100).toFixed(1);
	}

	// Placeholder for R2 image URL construction
	function getImageUrl(imageKey: string | null) {
		if (!imageKey) return null;
		// TODO: Replace with your R2 public URL
		return `/api/images/${imageKey}`;
	}
</script>

<svelte:head>
	<title>Products - Klimboys</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold">Products</h1>
			<p class="text-base-content/70 mt-1">Manage your milkshake menu</p>
		</div>
		{#if data.userRole === 'admin'}
			<Button
				variant="primary"
				icon={Plus}
				onclick={() => (showCreateModal = true)}
			>
				Add Product
			</Button>
		{/if}
	</div>

	<!-- Products Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each data.products as product}
			<div class="card bg-base-100 shadow-xl">
				<!-- Product Image -->
				<figure class="relative h-48 bg-base-200">
					{#if product.imageUrl}
						<img
							src={getImageUrl(product.imageUrl)}
							alt={product.title}
							class="w-full h-full object-cover"
							onerror={(e) => {
								e.currentTarget.style.display = 'none';
								e.currentTarget.nextElementSibling?.classList.remove('hidden');
							}}
						/>
						<div class="hidden absolute inset-0 flex items-center justify-center">
							<ImageOff class="w-12 h-12 text-base-content/30" />
						</div>
					{:else}
						<div class="absolute inset-0 flex items-center justify-center">
							<Package class="w-12 h-12 text-base-content/30" />
						</div>
					{/if}
					
					<!-- Availability Badge -->
					<div class="absolute top-2 right-2">
						<span class="badge {product.isAvailable ? 'badge-success' : 'badge-error'}">
							{product.isAvailable ? 'Available' : 'Unavailable'}
						</span>
					</div>
				</figure>

				<div class="card-body">
					<!-- Product Info -->
					<h2 class="card-title text-lg">
						{product.title}
						{#if product.category}
							<div class="badge badge-secondary badge-sm">{product.category.name}</div>
						{/if}
					</h2>
					
					{#if product.description}
						<p class="text-sm text-base-content/70 line-clamp-2">{product.description}</p>
					{/if}

					<div class="flex items-center gap-2 text-sm text-base-content/70">
						<span>{product.size}ml</span>
					</div>

					<!-- Pricing -->
					<div class="mt-auto pt-4 space-y-2">
						<div class="flex justify-between items-center">
							<span class="text-sm text-base-content/70">Price</span>
							<span class="font-semibold">{formatCurrency(product.sellingPrice)}</span>
						</div>
						
						{#if data.userRole === 'admin' && product.productCost !== undefined}
							<div class="flex justify-between items-center">
								<span class="text-sm text-base-content/70">Cost</span>
								<span class="text-sm">{formatCurrency(product.productCost)}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-base-content/70">Margin</span>
								<span class="text-sm font-medium text-success">
									{calculateMargin(product.productCost, product.sellingPrice)}%
								</span>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					{#if data.userRole === 'admin'}
						<div class="card-actions justify-end mt-4">
							<Button
								size="sm"
								variant="ghost"
								square
								icon={Edit2}
								onclick={() => openEditModal(product)}
							/>
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.type === 'success') {
											notifications.success('Product deleted', 'The product has been removed');
										}
									};
								}}
							>
								<input type="hidden" name="productId" value={product.id} />
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									square
									icon={Trash2}
									onclick={(e) => {
										if (!confirm('Are you sure you want to delete this product?')) {
											e.preventDefault();
										}
									}}
								/>
							</form>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="col-span-full text-center py-12">
				<Package class="w-16 h-16 mx-auto text-base-content/30 mb-4" />
				<p class="text-base-content/50">No products found</p>
				{#if data.userRole === 'admin'}
					<Button
						variant="primary"
						icon={Plus}
						onclick={() => (showCreateModal = true)}
						class="mt-4"
					>
						Add Your First Product
					</Button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Create Product Modal -->
{#if data.userRole === 'admin'}
	<dialog class="modal" class:modal-open={showCreateModal}>
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">Add New Product</h3>
			<form
				method="POST"
				action="?/create"
				enctype="multipart/form-data"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Product created', 'The new product has been added');
							closeModals();
							await update();
						}
					};
				}}
			>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Left Column -->
					<div class="space-y-4">
						<div class="form-control">
							<label class="label" for="create-title">
								<span class="label-text">Product Name</span>
							</label>
							<input
								id="create-title"
								name="title"
								type="text"
								class="input input-bordered"
								required
							/>
						</div>

						<div class="form-control">
							<label class="label" for="create-description">
								<span class="label-text">Description</span>
							</label>
							<textarea
								id="create-description"
								name="description"
								class="textarea textarea-bordered"
								rows="3"
							></textarea>
						</div>

						<div class="form-control">
							<label class="label" for="create-category">
								<span class="label-text">Category</span>
							</label>
							<select
								id="create-category"
								name="categoryId"
								class="select select-bordered"
							>
								<option value="">No category</option>
								{#each data.categories as category}
									<option value={category.id}>{category.name}</option>
								{/each}
							</select>
						</div>

						<div class="form-control">
							<label class="label" for="create-size">
								<span class="label-text">Size (ml)</span>
							</label>
							<input
								id="create-size"
								name="size"
								type="number"
								class="input input-bordered"
								required
								min="1"
							/>
						</div>
					</div>

					<!-- Right Column -->
					<div class="space-y-4">
						<div class="form-control">
							<label class="label" for="create-cost">
								<span class="label-text">Product Cost (IDR)</span>
							</label>
							<input
								id="create-cost"
								name="productCost"
								type="number"
								class="input input-bordered"
								required
								min="0"
							/>
						</div>

						<div class="form-control">
							<label class="label" for="create-price">
								<span class="label-text">Selling Price (IDR)</span>
							</label>
							<input
								id="create-price"
								name="sellingPrice"
								type="number"
								class="input input-bordered"
								required
								min="0"
							/>
						</div>

						<div class="form-control">
							<label class="label" for="create-image">
								<span class="label-text">Product Image</span>
							</label>
							<input
								id="create-image"
								name="image"
								type="file"
								class="file-input file-input-bordered"
								accept="image/jpeg,image/png,image/webp"
								onchange={(e) => handleImageChange(e)}
							/>
							<label class="label">
								<span class="label-text-alt">JPEG, PNG, or WebP. Max 5MB</span>
							</label>
						</div>

						{#if imagePreview}
							<div class="mt-2">
								<img src={imagePreview} alt="Preview" class="w-full h-32 object-cover rounded-lg" />
							</div>
						{/if}

						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Available for sale</span>
								<input
									type="checkbox"
									name="isAvailable"
									class="toggle toggle-success"
									checked
									value="true"
								/>
							</label>
						</div>
					</div>
				</div>

				<div class="modal-action">
					<Button
						type="button"
						variant="ghost"
						onclick={closeModals}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						{loading}
						loadingText="Creating..."
					>
						Create Product
					</Button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeModals}>close</button>
		</form>
	</dialog>

	<!-- Edit Product Modal -->
	<dialog class="modal" class:modal-open={showEditModal}>
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-4">Edit Product</h3>
			{#if selectedProduct}
				<form
					method="POST"
					action="?/update"
					enctype="multipart/form-data"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') {
								notifications.success('Product updated', 'The product has been updated');
								closeModals();
								await update();
							}
						};
					}}
				>
					<input type="hidden" name="productId" value={selectedProduct.id} />
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Left Column -->
						<div class="space-y-4">
							<div class="form-control">
								<label class="label" for="edit-title">
									<span class="label-text">Product Name</span>
								</label>
								<input
									id="edit-title"
									name="title"
									type="text"
									class="input input-bordered"
									value={selectedProduct.title}
									required
								/>
							</div>

							<div class="form-control">
								<label class="label" for="edit-description">
									<span class="label-text">Description</span>
								</label>
								<textarea
									id="edit-description"
									name="description"
									class="textarea textarea-bordered"
									rows="3"
									value={selectedProduct.description || ''}
								></textarea>
							</div>

							<div class="form-control">
								<label class="label" for="edit-category">
									<span class="label-text">Category</span>
								</label>
								<select
									id="edit-category"
									name="categoryId"
									class="select select-bordered"
									value={selectedProduct.categoryId || ''}
								>
									<option value="">No category</option>
									{#each data.categories as category}
										<option value={category.id}>{category.name}</option>
									{/each}
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="edit-size">
									<span class="label-text">Size (ml)</span>
								</label>
								<input
									id="edit-size"
									name="size"
									type="number"
									class="input input-bordered"
									value={selectedProduct.size}
									required
									min="1"
								/>
							</div>
						</div>

						<!-- Right Column -->
						<div class="space-y-4">
							<div class="form-control">
								<label class="label" for="edit-cost">
									<span class="label-text">Product Cost (IDR)</span>
								</label>
								<input
									id="edit-cost"
									name="productCost"
									type="number"
									class="input input-bordered"
									value={selectedProduct.productCost}
									required
									min="0"
								/>
							</div>

							<div class="form-control">
								<label class="label" for="edit-price">
									<span class="label-text">Selling Price (IDR)</span>
								</label>
								<input
									id="edit-price"
									name="sellingPrice"
									type="number"
									class="input input-bordered"
									value={selectedProduct.sellingPrice}
									required
									min="0"
								/>
							</div>

							<div class="form-control">
								<label class="label" for="edit-image">
									<span class="label-text">Product Image</span>
								</label>
								<input
									id="edit-image"
									name="image"
									type="file"
									class="file-input file-input-bordered"
									accept="image/jpeg,image/png,image/webp"
									onchange={(e) => handleImageChange(e, true)}
								/>
								<label class="label">
									<span class="label-text-alt">Upload new image to replace existing</span>
								</label>
							</div>

							{#if editImagePreview}
								<div class="mt-2">
									<img src={editImagePreview} alt="New Preview" class="w-full h-32 object-cover rounded-lg" />
								</div>
							{:else if selectedProduct.imageUrl}
								<div class="mt-2">
									<img src={getImageUrl(selectedProduct.imageUrl)} alt="Current" class="w-full h-32 object-cover rounded-lg" />
								</div>
							{/if}

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Available for sale</span>
									<input
										type="checkbox"
										name="isAvailable"
										class="toggle toggle-success"
										checked={selectedProduct.isAvailable}
										value="true"
									/>
								</label>
							</div>
						</div>
					</div>

					<div class="modal-action">
						<Button
							type="button"
							variant="ghost"
							onclick={closeModals}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="primary"
							{loading}
							loadingText="Updating..."
						>
							Update Product
						</Button>
					</div>
				</form>
			{/if}
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeModals}>close</button>
		</form>
	</dialog>
{/if}