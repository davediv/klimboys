<script lang="ts">
	import {
		Package,
		Plus,
		Edit,
		Trash2,
		Search,
		Save,
		AlertCircle,
		Upload,
		Image,
		X
	} from '@lucide/svelte';

	let searchQuery = $state('');
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedProduct = $state<any>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Image upload states
	let imageFile = $state<File | null>(null);
	let uploadingImage = $state(false);
	let imagePreview = $state<string | null>(null);

	// Form states for add/edit
	let formData = $state({
		name: '',
		description: '',
		category: '',
		imageUrl: '',
		variants: [] as Array<{
			size: string;
			volumeMl: number;
			costPrice: number;
			sellingPrice: number;
			stockQuantity: number;
		}>
	});

	// Products fetched from API
	let products = $state<any[]>([]);

	// Fetch products from API
	async function fetchProducts() {
		loading = true;
		error = null;
		try {
			const response = await fetch('/api/products?limit=100&active=true');
			if (!response.ok) {
				throw new Error('Failed to fetch products');
			}
			const result = (await response.json()) as any;
			if (result.success && result.data) {
				products = result.data.products || [];
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load products';
			console.error('Error fetching products:', err);
		} finally {
			loading = false;
		}
	}

	// Load products on mount
	$effect(() => {
		fetchProducts();
	});

	let filteredProducts = $derived(
		products.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.category.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Categories for dropdown
	const categories = ['Classic', 'Fruity', 'Special', 'Seasonal'];

	// Available sizes for variants
	const availableSizes = ['S', 'M', 'L', 'XL'];

	// Add a new variant
	function addVariant() {
		const usedSizes = formData.variants.map((v) => v.size);
		const availableSize = availableSizes.find((size) => !usedSizes.includes(size));

		if (availableSize) {
			formData.variants = [
				...formData.variants,
				{
					size: availableSize,
					volumeMl: 250,
					costPrice: 0,
					sellingPrice: 0,
					stockQuantity: 0
				}
			];
		} else {
			error = 'Maximum number of variants reached';
			setTimeout(() => (error = null), 3000);
		}
	}

	// Remove a variant
	function removeVariant(index: number) {
		if (formData.variants.length > 1) {
			formData.variants = formData.variants.filter((_, i) => i !== index);
		} else {
			error = 'At least one variant is required';
			setTimeout(() => (error = null), 3000);
		}
	}

	// Update variant size
	function updateVariantSize(index: number, newSize: string) {
		formData.variants[index].size = newSize;
		// Suggest default volume based on size
		if (newSize === 'S') formData.variants[index].volumeMl = 250;
		else if (newSize === 'M') formData.variants[index].volumeMl = 350;
		else if (newSize === 'L') formData.variants[index].volumeMl = 500;
		else if (newSize === 'XL') formData.variants[index].volumeMl = 750;
	}

	function openAddModal() {
		formData = {
			name: '',
			description: '',
			category: 'Classic',
			imageUrl: '',
			variants: [{ size: 'S', volumeMl: 250, costPrice: 0, sellingPrice: 0, stockQuantity: 0 }]
		};
		imageFile = null;
		imagePreview = null;
		showAddModal = true;
	}

	function openEditModal(product: any) {
		selectedProduct = product;
		formData = {
			name: product.name,
			description: product.description,
			category: product.category,
			imageUrl: product.imageUrl || '',
			variants: product.variants.map((v: any) => ({
				size: v.size,
				volumeMl: v.volumeMl,
				costPrice: v.costPrice / 100, // Convert from cents to currency
				sellingPrice: v.sellingPrice / 100, // Convert from cents to currency
				stockQuantity: v.stockQuantity
			}))
		};
		imageFile = null;
		imagePreview = product.imageUrl || null;
		showEditModal = true;
	}

	function openDeleteModal(product: any) {
		selectedProduct = product;
		showDeleteModal = true;
	}

	async function handleAddProduct() {
		loading = true;
		error = null;
		try {
			// Validate form
			if (!formData.name.trim()) {
				error = 'Product name is required';
				return;
			}
			if (!formData.category) {
				error = 'Product category is required';
				return;
			}
			if (formData.variants.length === 0) {
				error = 'At least one variant is required';
				return;
			}

			// First, create the product
			const response = await fetch('/api/products', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formData.name,
					description: formData.description || null,
					category: formData.category,
					imageUrl: formData.imageUrl || null,
					isActive: true,
					variants: formData.variants.map((v) => ({
						size: v.size,
						volumeMl: v.volumeMl,
						costPrice: v.costPrice * 100, // Convert to cents
						sellingPrice: v.sellingPrice * 100, // Convert to cents
						stockQuantity: v.stockQuantity
					}))
				})
			});

			if (!response.ok) {
				const errorData = (await response.json()) as any;
				throw new Error(errorData.error || 'Failed to add product');
			}

			const result = (await response.json()) as any;
			if (result.success && result.data) {
				const productId = result.data.product.id;

				// Upload image if file selected
				if (imageFile) {
					try {
						const imageUrl = await uploadImage(productId);
						if (imageUrl) {
							// Image uploaded successfully, it's already associated with the product
							successMessage = 'Product added with image successfully!';
						}
					} catch (imgErr) {
						// Product created but image upload failed
						console.error('Image upload failed:', imgErr);
						successMessage = 'Product added, but image upload failed';
					}
				} else {
					successMessage = 'Product added successfully!';
				}

				showAddModal = false;
				await fetchProducts(); // Refresh the list
				setTimeout(() => (successMessage = null), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add product';
			console.error('Error adding product:', err);
		} finally {
			loading = false;
		}
	}

	async function handleEditProduct() {
		if (!selectedProduct) return;

		loading = true;
		error = null;
		try {
			// Validate form
			if (!formData.name.trim()) {
				error = 'Product name is required';
				return;
			}
			if (!formData.category) {
				error = 'Product category is required';
				return;
			}
			if (formData.variants.length === 0) {
				error = 'At least one variant is required';
				return;
			}

			// Upload image first if file selected
			let newImageUrl = formData.imageUrl;
			if (imageFile) {
				try {
					const uploadedUrl = await uploadImage(selectedProduct.id);
					if (uploadedUrl) {
						newImageUrl = uploadedUrl;
					}
				} catch (imgErr) {
					console.error('Image upload failed:', imgErr);
					// Continue with update even if image upload fails
				}
			}

			const response = await fetch(`/api/products/${selectedProduct.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formData.name,
					description: formData.description || null,
					category: formData.category,
					imageUrl: newImageUrl || null,
					variants: formData.variants.map((v) => ({
						size: v.size,
						volumeMl: v.volumeMl,
						costPrice: v.costPrice * 100, // Convert to cents
						sellingPrice: v.sellingPrice * 100, // Convert to cents
						stockQuantity: v.stockQuantity
					}))
				})
			});

			if (!response.ok) {
				const errorData = (await response.json()) as any;
				throw new Error(errorData.error || 'Failed to update product');
			}

			const result = (await response.json()) as any;
			if (result.success) {
				successMessage = imageFile
					? 'Product and image updated successfully!'
					: 'Product updated successfully!';
				showEditModal = false;
				await fetchProducts(); // Refresh the list
				setTimeout(() => (successMessage = null), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update product';
			console.error('Error updating product:', err);
		} finally {
			loading = false;
		}
	}

	async function handleDeleteProduct() {
		if (!selectedProduct) return;

		loading = true;
		error = null;
		try {
			const response = await fetch(`/api/products/${selectedProduct.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = (await response.json()) as any;
				throw new Error(errorData.error || 'Failed to delete product');
			}

			const result = (await response.json()) as any;
			if (result.success) {
				successMessage = 'Product deleted successfully!';
				showDeleteModal = false;
				await fetchProducts(); // Refresh the list
				setTimeout(() => (successMessage = null), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete product';
			console.error('Error deleting product:', err);
		} finally {
			loading = false;
		}
	}

	async function toggleProductStatus(productId: string) {
		const product = products.find((p) => p.id === productId);
		if (!product) return;

		loading = true;
		error = null;
		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isActive: !product.isActive
				})
			});

			if (!response.ok) {
				const errorData = (await response.json()) as any;
				throw new Error(errorData.error || 'Failed to toggle product status');
			}

			const result = (await response.json()) as any;
			if (result.success) {
				await fetchProducts(); // Refresh the list
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to toggle product status';
			console.error('Error toggling product status:', err);
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	// Handle file selection
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				error = 'Only JPEG, PNG, and WebP images are allowed';
				return;
			}

			// Validate file size (5MB)
			if (file.size > 5 * 1024 * 1024) {
				error = 'File size must be less than 5MB';
				return;
			}

			imageFile = file;

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// Upload image to R2
	async function uploadImage(productId?: string): Promise<string | null> {
		if (!imageFile) return null;

		uploadingImage = true;
		try {
			const formData = new FormData();
			formData.append('file', imageFile);

			const endpoint = productId ? `/api/products/${productId}/image` : '/api/upload';

			const response = await fetch(endpoint, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = (await response.json()) as any;
				throw new Error(errorData.error || 'Failed to upload image');
			}

			const result = (await response.json()) as any;
			if (result.success && result.data) {
				if (productId) {
					return result.data.image?.url || null;
				}
				return result.data.url || null;
			}
			return null;
		} catch (err) {
			console.error('Error uploading image:', err);
			throw err;
		} finally {
			uploadingImage = false;
		}
	}

	// Remove selected image
	function removeImage() {
		imageFile = null;
		imagePreview = null;
		formData.imageUrl = '';
	}
</script>

<div class="container mx-auto p-4">
	<!-- Success/Error Messages -->
	{#if successMessage}
		<div class="mb-4 alert alert-success">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{successMessage}</span>
		</div>
	{/if}

	{#if error && !showAddModal && !showEditModal && !showDeleteModal}
		<div class="mb-4 alert alert-error">
			<AlertCircle class="h-6 w-6" />
			<span>{error}</span>
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Product Management</h1>
			<p class="text-base-content/70">Manage your product catalog</p>
		</div>
		<button class="btn btn-primary" onclick={openAddModal} disabled={loading}>
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
						{#if loading && products.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center">
									<span class="loading loading-lg loading-spinner"></span>
									<p class="mt-2">Loading products...</p>
								</td>
							</tr>
						{:else if products.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center">
									<Package class="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>No products found</p>
									<button class="btn mt-2 btn-sm btn-primary" onclick={openAddModal}>
										Add your first product
									</button>
								</td>
							</tr>
						{:else}
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
													{formatCurrency(variant.sellingPrice / 100)}
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
											disabled={loading}
										>
											{product.isActive ? 'Active' : 'Inactive'}
										</button>
									</td>
									<td>
										<div class="flex gap-2">
											<button
												class="btn btn-ghost btn-xs"
												onclick={() => openEditModal(product)}
												disabled={loading}
											>
												<Edit class="h-4 w-4" />
											</button>
											<button
												class="btn text-error btn-ghost btn-xs"
												onclick={() => openDeleteModal(product)}
												disabled={loading}
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
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

			{#if error}
				<div class="mb-4 alert alert-error">
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			{/if}

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

				<!-- Image Upload -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Product Image</span>
					</label>

					{#if imagePreview}
						<div class="mb-4">
							<img
								src={imagePreview}
								alt="Product preview"
								class="mx-auto h-32 w-32 rounded-lg object-cover"
							/>
							<button type="button" class="btn mt-2 w-full btn-sm btn-error" onclick={removeImage}>
								Remove Image
							</button>
						</div>
					{/if}

					<div class="flex gap-2">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onchange={handleFileSelect}
							class="file-input-bordered file-input flex-1"
							disabled={uploadingImage || loading}
						/>
					</div>

					<div class="label">
						<span class="label-text-alt">Or enter image URL</span>
					</div>
					<input
						type="url"
						placeholder="https://example.com/image.jpg"
						class="input-bordered input"
						bind:value={formData.imageUrl}
						disabled={imageFile !== null}
					/>
					<div class="label">
						<span class="label-text-alt">Accepted formats: JPEG, PNG, WebP (max 5MB)</span>
					</div>
				</div>

				<!-- Variants -->
				<div class="divider">
					Variants & Pricing
					<button
						type="button"
						class="btn ml-2 btn-xs btn-primary"
						onclick={addVariant}
						disabled={formData.variants.length >= availableSizes.length}
					>
						<Plus class="h-3 w-3" />
						Add Variant
					</button>
				</div>

				{#if formData.variants.length === 0}
					<div class="py-4 text-center text-base-content/50">
						<p>No variants added yet.</p>
						<button type="button" class="btn mt-2 btn-sm btn-primary" onclick={addVariant}>
							<Plus class="h-4 w-4" />
							Add First Variant
						</button>
					</div>
				{/if}

				{#each formData.variants as variant, i}
					<div class="card bg-base-200">
						<div class="card-body p-4">
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<select
										class="select-bordered select select-sm"
										value={variant.size}
										onchange={(e) => updateVariantSize(i, (e.target as HTMLSelectElement).value)}
									>
										{#each availableSizes as size}
											<option
												value={size}
												disabled={formData.variants.some((v, idx) => idx !== i && v.size === size)}
											>
												Size {size}
											</option>
										{/each}
									</select>
									<span class="text-sm text-base-content/50">Variant {i + 1}</span>
								</div>
								<button
									type="button"
									class="btn text-error btn-ghost btn-xs"
									onclick={() => removeVariant(i)}
									disabled={formData.variants.length === 1}
								>
									<X class="h-4 w-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Volume (ml)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.volumeMl}
										min="50"
										step="50"
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
										min="0"
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
										min="0"
										step="100"
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
										min="0"
										step="100"
									/>
								</div>
							</div>
							{#if variant.sellingPrice > 0 && variant.costPrice > 0}
								<div class="mt-2 text-xs text-base-content/70">
									Profit Margin: {formatCurrency(variant.sellingPrice - variant.costPrice)}
									({Math.round(
										((variant.sellingPrice - variant.costPrice) / variant.costPrice) * 100
									)}%)
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showAddModal = false;
						error = null;
					}}
					disabled={loading}>Cancel</button
				>
				<button class="btn btn-primary" onclick={handleAddProduct} disabled={loading}>
					{#if loading || uploadingImage}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						<Save class="h-4 w-4" />
					{/if}
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

			{#if error}
				<div class="mb-4 alert alert-error">
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			{/if}

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

				<!-- Image Upload -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Product Image</span>
					</label>

					{#if imagePreview}
						<div class="mb-4">
							<img
								src={imagePreview}
								alt="Product preview"
								class="mx-auto h-32 w-32 rounded-lg object-cover"
							/>
							<button type="button" class="btn mt-2 w-full btn-sm btn-error" onclick={removeImage}>
								Remove Image
							</button>
						</div>
					{/if}

					<div class="flex gap-2">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onchange={handleFileSelect}
							class="file-input-bordered file-input flex-1"
							disabled={uploadingImage || loading}
						/>
					</div>

					<div class="label">
						<span class="label-text-alt">Or enter image URL</span>
					</div>
					<input
						type="url"
						placeholder="https://example.com/image.jpg"
						class="input-bordered input"
						bind:value={formData.imageUrl}
						disabled={imageFile !== null}
					/>
					<div class="label">
						<span class="label-text-alt">Accepted formats: JPEG, PNG, WebP (max 5MB)</span>
					</div>
				</div>

				<!-- Variants -->
				<div class="divider">
					Variants & Pricing
					<button
						type="button"
						class="btn ml-2 btn-xs btn-primary"
						onclick={addVariant}
						disabled={formData.variants.length >= availableSizes.length}
					>
						<Plus class="h-3 w-3" />
						Add Variant
					</button>
				</div>

				{#if formData.variants.length === 0}
					<div class="py-4 text-center text-base-content/50">
						<p>No variants added yet.</p>
						<button type="button" class="btn mt-2 btn-sm btn-primary" onclick={addVariant}>
							<Plus class="h-4 w-4" />
							Add First Variant
						</button>
					</div>
				{/if}

				{#each formData.variants as variant, i}
					<div class="card bg-base-200">
						<div class="card-body p-4">
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<select
										class="select-bordered select select-sm"
										value={variant.size}
										onchange={(e) => updateVariantSize(i, (e.target as HTMLSelectElement).value)}
									>
										{#each availableSizes as size}
											<option
												value={size}
												disabled={formData.variants.some((v, idx) => idx !== i && v.size === size)}
											>
												Size {size}
											</option>
										{/each}
									</select>
									<span class="text-sm text-base-content/50">Variant {i + 1}</span>
								</div>
								<button
									type="button"
									class="btn text-error btn-ghost btn-xs"
									onclick={() => removeVariant(i)}
									disabled={formData.variants.length === 1}
								>
									<X class="h-4 w-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="form-control">
									<label class="label">
										<span class="label-text text-xs">Volume (ml)</span>
									</label>
									<input
										type="number"
										class="input-bordered input input-sm"
										bind:value={variant.volumeMl}
										min="50"
										step="50"
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
										min="0"
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
										min="0"
										step="100"
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
										min="0"
										step="100"
									/>
								</div>
							</div>
							{#if variant.sellingPrice > 0 && variant.costPrice > 0}
								<div class="mt-2 text-xs text-base-content/70">
									Profit Margin: {formatCurrency(variant.sellingPrice - variant.costPrice)}
									({Math.round(
										((variant.sellingPrice - variant.costPrice) / variant.costPrice) * 100
									)}%)
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showEditModal = false;
						error = null;
					}}
					disabled={loading}>Cancel</button
				>
				<button class="btn btn-primary" onclick={handleEditProduct} disabled={loading}>
					{#if loading || uploadingImage}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						<Save class="h-4 w-4" />
					{/if}
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

			{#if error}
				<div class="mb-4 alert alert-error">
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			{/if}

			<div class="mb-4 alert alert-warning">
				<AlertCircle class="h-6 w-6" />
				<span>This will mark the product as inactive. It can be reactivated later if needed.</span>
			</div>

			{#if selectedProduct}
				<p class="mb-4">
					Are you sure you want to delete <strong>{selectedProduct.name}</strong>?
				</p>
			{/if}

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						error = null;
					}}
					disabled={loading}>Cancel</button
				>
				<button class="btn btn-error" onclick={handleDeleteProduct} disabled={loading}>
					{#if loading}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						<Trash2 class="h-4 w-4" />
					{/if}
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
