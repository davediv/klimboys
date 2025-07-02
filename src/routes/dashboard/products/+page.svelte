<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import { Plus, Edit2, Trash2, Package, ImageOff, DollarSign } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { jakartaTime } from '$lib/utils/datetime';
	import { dev } from '$app/environment';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedProduct = $state<(typeof data.products)[0] | null>(null);
	let loading = $state(false);
	let imagePreview = $state<string | null>(null);
	let editImagePreview = $state<string | null>(null);
	let uploadingImage = $state(false);
	let uploadedImageUrl = $state<string | null>(null);
	let editUploadingImage = $state(false);
	let editUploadedImageUrl = $state<string | null>(null);

	function openEditModal(product: (typeof data.products)[0]) {
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
		uploadedImageUrl = null;
		editUploadedImageUrl = null;
	}

	async function handleImageChange(event: Event, isEdit = false) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			// Show preview
			const reader = new FileReader();
			reader.onload = (e) => {
				if (isEdit) {
					editImagePreview = e.target?.result as string;
				} else {
					imagePreview = e.target?.result as string;
				}
			};
			reader.readAsDataURL(file);

			// Upload file immediately
			try {
				if (isEdit) {
					editUploadingImage = true;
				} else {
					uploadingImage = true;
				}

				const formData = new FormData();
				formData.append('file', file);
				formData.append('category', 'products');

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				const result = await response.json();

				if (!response.ok) {
					notifications.error('Upload Failed', result.error || 'Failed to upload image');
					// Clear preview on error
					if (isEdit) {
						editImagePreview = null;
					} else {
						imagePreview = null;
					}
					return;
				}

				// Store the uploaded image key
				if (isEdit) {
					editUploadedImageUrl = result.file.key;
				} else {
					uploadedImageUrl = result.file.key;
				}
				
				console.log('Image uploaded successfully:', {
					key: result.file.key,
					url: result.file.url,
					uploadedImageUrl,
					editUploadedImageUrl
				});

				notifications.success('Image Uploaded', 'Image uploaded successfully');
			} catch (error) {
				notifications.error('Upload Failed', 'Failed to upload image');
				// Clear preview on error
				if (isEdit) {
					editImagePreview = null;
				} else {
					imagePreview = null;
				}
			} finally {
				if (isEdit) {
					editUploadingImage = false;
				} else {
					uploadingImage = false;
				}
			}
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
		return (((price - cost) / price) * 100).toFixed(1);
	}

	// Get image URL - handles both production and development
	function getImageUrl(imageKey: string | null) {
		if (!imageKey) return null;
		const url = `/api/images/${imageKey}`;
		console.log('Generated image URL:', url, 'from key:', imageKey);
		return url;
	}
	
	// Handle image error by showing placeholder (fallback)
	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		
		console.error('Image failed to load:', {
			src: img.src,
			currentSrc: img.currentSrc,
			complete: img.complete,
			naturalWidth: img.naturalWidth,
			naturalHeight: img.naturalHeight
		});
		
		// Prevent infinite loop - only try placeholder once
		if (img.dataset.placeholderAttempted === 'true') {
			return;
		}
		
		// Mark that we've attempted placeholder
		img.dataset.placeholderAttempted = 'true';
		
		// Use a data URL as ultimate fallback
		const placeholderDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
		img.src = placeholderDataUrl;
	}
</script>

<svelte:head>
	<title>Products - Klimboys</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">Products</h1>
			<p class="text-base-content/70 mt-1">Manage your milkshake menu</p>
		</div>
		<div class="flex gap-2">
			{#if data.userRole === 'admin'}
				<Button 
					variant="ghost" 
					onclick={async () => {
						const testUrl = '/api/images/products/test.jpg';
						console.log('Testing image API with URL:', testUrl);
						try {
							const res = await fetch(testUrl);
							const text = await res.text();
							console.log('Test response:', {
								status: res.status,
								headers: Object.fromEntries(res.headers.entries()),
								bodyPreview: text.substring(0, 200)
							});
						} catch (err) {
							console.error('Test failed:', err);
						}
					}}
				>
					Test API
				</Button>
				<Button variant="primary" icon={Plus} onclick={() => (showCreateModal = true)}>
					Add Product
				</Button>
			{/if}
		</div>
	</div>

	<!-- Products Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each data.products as product}
			<div class="card bg-base-100 shadow-xl">
				<!-- Product Image -->
				<figure class="bg-base-200 relative h-48">
					{#if product.imageUrl}
						{@const imgUrl = getImageUrl(product.imageUrl)}
						<img
							src={imgUrl}
							alt={product.title}
							class="h-full w-full object-cover"
							onerror={handleImageError}
							onload={(e) => {
								console.log('Image loaded successfully:', imgUrl);
								// Test fetch to see if API is reachable
								fetch(imgUrl)
									.then(res => {
										console.log('Fetch response:', {
											url: imgUrl,
											status: res.status,
											statusText: res.statusText,
											headers: Object.fromEntries(res.headers.entries()),
											ok: res.ok
										});
										return res.text();
									})
									.then(text => {
										console.log('Response body preview:', text.substring(0, 200));
									})
									.catch(err => {
										console.error('Fetch error:', err);
									});
							}}
						/>
					{:else}
						<div class="absolute inset-0 flex items-center justify-center">
							<Package class="text-base-content/30 h-12 w-12" />
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
						<p class="text-base-content/70 line-clamp-2 text-sm">{product.description}</p>
					{/if}

					<div class="text-base-content/70 flex items-center gap-2 text-sm">
						<span>{product.size}ml</span>
					</div>

					<!-- Pricing -->
					<div class="mt-auto space-y-2 pt-4">
						<div class="flex items-center justify-between">
							<span class="text-base-content/70 text-sm">Price</span>
							<span class="font-semibold">{formatCurrency(product.sellingPrice)}</span>
						</div>

						{#if data.userRole === 'admin' && product.productCost !== undefined}
							<div class="flex items-center justify-between">
								<span class="text-base-content/70 text-sm">Cost</span>
								<span class="text-sm">{formatCurrency(product.productCost)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-base-content/70 text-sm">Margin</span>
								<span class="text-success text-sm font-medium">
									{calculateMargin(product.productCost, product.sellingPrice)}%
								</span>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					{#if data.userRole === 'admin'}
						<div class="card-actions mt-4 justify-end">
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
			<h3 class="mb-4 text-lg font-bold">Add New Product</h3>
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Product created', 'The new product has been added');
							await update();
							closeModals();
						}
					};
				}}
			>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
							<select id="create-category" name="categoryId" class="select select-bordered">
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
								type="file"
								class="file-input file-input-bordered"
								accept="image/jpeg,image/png,image/webp"
								onchange={(e) => handleImageChange(e)}
								disabled={uploadingImage}
							/>
							<label class="label">
								<span class="label-text-alt">
									{#if uploadingImage}
										Uploading image...
									{:else}
										JPEG, PNG, or WebP. Max 5MB
									{/if}
								</span>
							</label>
							{#if uploadedImageUrl}
								<input type="hidden" name="imageUrl" value={uploadedImageUrl} />
							{/if}
						</div>

						{#if imagePreview}
							<div class="mt-2">
								<img src={imagePreview} alt="Preview" class="h-32 w-full rounded-lg object-cover" />
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
					<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
					<Button type="submit" variant="primary" {loading} loadingText="Creating...">
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
			<h3 class="mb-4 text-lg font-bold">Edit Product</h3>
			{#if selectedProduct}
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') {
								notifications.success('Product updated', 'The product has been updated');
								await update();
								closeModals();
							}
						};
					}}
				>
					<input type="hidden" name="productId" value={selectedProduct.id} />

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
									type="file"
									class="file-input file-input-bordered"
									accept="image/jpeg,image/png,image/webp"
									onchange={(e) => handleImageChange(e, true)}
									disabled={editUploadingImage}
								/>
								<label class="label">
									<span class="label-text-alt">
										{#if editUploadingImage}
											Uploading image...
										{:else}
											Upload new image to replace existing
										{/if}
									</span>
								</label>
								{#if editUploadedImageUrl}
									<input type="hidden" name="imageUrl" value={editUploadedImageUrl} />
								{/if}
							</div>

							{#if editImagePreview}
								<div class="mt-2">
									<img
										src={editImagePreview}
										alt="New Preview"
										class="h-32 w-full rounded-lg object-cover"
									/>
								</div>
							{:else if selectedProduct.imageUrl}
								<div class="mt-2">
									<img
										src={getImageUrl(selectedProduct.imageUrl)}
										alt="Current"
										class="h-32 w-full rounded-lg object-cover"
										onerror={handleImageError}
									/>
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
						<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
						<Button type="submit" variant="primary" {loading} loadingText="Updating...">
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
