<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import {
		AlertCircle,
		Archive,
		ArrowLeft,
		ArrowRight,
		Edit,
		Package,
		Plus,
		RotateCcw,
		Save,
		Search,
		X
	} from '@lucide/svelte';
	import { formatIdr } from '$lib/format';
	import type { CatalogProduct } from '$lib/product';
	import {
		alertStyles,
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		cx,
		dividerStyles,
		fieldHintStyles,
		fieldLabelStyles,
		fileInputStyles,
		inputStyles,
		modalActionsStyles,
		modalBackdropStyles,
		modalPanelStyles,
		modalRootStyles,
		selectStyles,
		spinnerStyles,
		tableStyles,
		textareaStyles
	} from '$lib/styles';
	import type { PageData } from './$types';

	interface ApiErrorResponse {
		error?: string;
	}

	interface ProductMutationResponse {
		success: boolean;
		data?: CatalogProduct;
	}

	interface ImageMutationResponse {
		success: boolean;
		data?: { url?: string; image?: { url?: string } };
	}

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showArchiveModal = $state(false);
	let selectedProduct = $state<CatalogProduct | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(data.productsError);
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
			id?: string;
			size: string;
			volumeMl: number;
			costPrice: number;
			sellingPrice: number;
		}>
	});

	let products = $derived(data.products);

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
					sellingPrice: 0
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
			variants: [{ size: 'S', volumeMl: 250, costPrice: 0, sellingPrice: 0 }]
		};
		imageFile = null;
		imagePreview = null;
		showAddModal = true;
	}

	function openEditModal(product: CatalogProduct) {
		selectedProduct = product;
		formData = {
			name: product.name,
			description: product.description ?? '',
			category: product.category,
			imageUrl: product.imageUrl || '',
			variants: product.variants.map((v) => ({
				id: v.id,
				size: v.size,
				volumeMl: v.volumeMl,
				costPrice: v.costPrice / 100, // Convert from cents to currency
				sellingPrice: v.sellingPrice / 100 // Convert from cents to currency
			}))
		};
		imageFile = null;
		imagePreview = product.imageUrl || null;
		showEditModal = true;
	}

	function openArchiveModal(product: CatalogProduct) {
		selectedProduct = product;
		showArchiveModal = true;
	}

	function pageHref(page: number): string {
		const params = new SvelteURLSearchParams();
		if (data.search) params.set('search', data.search);
		if (data.status !== 'active') params.set('status', data.status);
		if (page > 1) params.set('page', String(page));
		const query = params.toString();
		return query ? `/staff/catalog?${query}` : '/staff/catalog';
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
						sellingPrice: v.sellingPrice * 100 // Convert to cents
					}))
				})
			});

			if (!response.ok) {
				const errorData = (await response.json()) as ApiErrorResponse;
				throw new Error(errorData.error || 'Failed to add product');
			}

			const result = (await response.json()) as ProductMutationResponse;
			if (result.success && result.data) {
				const productId = result.data.id;

				// Upload image if file selected
				if (imageFile) {
					try {
						const imageUrl = await uploadImage(productId);
						if (imageUrl) {
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

				await invalidateAll();
				showAddModal = false;
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
						id: v.id,
						size: v.size,
						volumeMl: v.volumeMl,
						costPrice: v.costPrice * 100, // Convert to cents
						sellingPrice: v.sellingPrice * 100 // Convert to cents
					}))
				})
			});

			if (!response.ok) {
				const errorData = (await response.json()) as ApiErrorResponse;
				throw new Error(errorData.error || 'Failed to update product');
			}

			const result = (await response.json()) as ProductMutationResponse;
			if (result.success && result.data) {
				await invalidateAll();
				successMessage = imageFile
					? 'Product and image updated successfully!'
					: 'Product updated successfully!';
				showEditModal = false;
				setTimeout(() => (successMessage = null), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update product';
			console.error('Error updating product:', err);
		} finally {
			loading = false;
		}
	}

	async function handleArchiveProduct() {
		if (!selectedProduct) return;
		const productId = selectedProduct.id;

		loading = true;
		error = null;
		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = (await response.json()) as ApiErrorResponse;
				throw new Error(errorData.error || 'Failed to archive product');
			}

			const result = (await response.json()) as { success: boolean };
			if (result.success) {
				await invalidateAll();
				successMessage = 'Product archived successfully.';
				showArchiveModal = false;
				setTimeout(() => (successMessage = null), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to archive product';
			console.error('Error archiving product:', err);
		} finally {
			loading = false;
		}
	}

	async function restoreProduct(productId: string) {
		loading = true;
		error = null;
		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isActive: true
				})
			});

			if (!response.ok) {
				const errorData = (await response.json()) as ApiErrorResponse;
				throw new Error(errorData.error || 'Failed to restore product');
			}

			const result = (await response.json()) as ProductMutationResponse;
			if (result.success && result.data) {
				await invalidateAll();
				successMessage = 'Product restored successfully.';
				setTimeout(() => (successMessage = null), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to restore product';
			console.error('Error restoring product:', err);
		} finally {
			loading = false;
		}
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
				const errorData = (await response.json()) as ApiErrorResponse;
				throw new Error(errorData.error || 'Failed to upload image');
			}

			const result = (await response.json()) as ImageMutationResponse;
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
		<div class={cx(alertStyles('positive'), 'mb-4')}>
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

	{#if error && !showAddModal && !showEditModal && !showArchiveModal}
		<div class={cx(alertStyles('danger'), 'mb-4')}>
			<AlertCircle class="h-6 w-6" />
			<span>{error}</span>
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Catalog</h1>
			<p class="text-ink/70">
				Manage product details and pricing. Record quantity changes in
				<a class="font-medium underline" href="/staff/inventory">Inventory</a>.
			</p>
		</div>
		<button class={buttonStyles({ tone: 'brand' })} onclick={openAddModal} disabled={loading}>
			<Plus class="h-5 w-5" />
			Add Product
		</button>
	</div>

	<!-- Server-driven search and lifecycle filters -->
	<form method="GET" class={cx(cardStyles, 'mb-6 bg-surface shadow-xl')}>
		<div class={cardBodyStyles}>
			<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto_auto] sm:items-end">
				<div>
					<label for="catalog-search" class={fieldLabelStyles}>Search catalog</label>
					<div class="relative">
						<Search
							class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-ink/40"
						/>
						<input
							id="catalog-search"
							name="search"
							type="search"
							placeholder="Search by product or category"
							class={cx(inputStyles({ full: true }), 'pl-10')}
							value={data.search}
						/>
					</div>
				</div>
				<div>
					<label for="catalog-status" class={fieldLabelStyles}>Status</label>
					<select
						id="catalog-status"
						name="status"
						class={selectStyles({ full: true })}
						value={data.status}
					>
						<option value="active">Active</option>
						<option value="inactive">Archived</option>
						<option value="all">All</option>
					</select>
				</div>
				<button type="submit" class={buttonStyles({ tone: 'brand' })}>Apply filters</button>
				<a href="/staff/catalog" class={buttonStyles({ variant: 'ghost' })}>Clear</a>
			</div>
		</div>
	</form>

	<!-- Products Table -->
	<div class={cx(cardStyles, 'bg-surface shadow-xl')}>
		<div class={cardBodyStyles}>
			<p class="font-medium text-ink/70">
				{data.pagination.totalItems}
				{data.status === 'inactive' ? 'archived' : data.status} product{data.pagination
					.totalItems === 1
					? ''
					: 's'}
			</p>
			<div class="overflow-x-auto">
				<table class={tableStyles}>
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
									<span class={spinnerStyles('lg')}></span>
									<p class="mt-2">Loading products...</p>
								</td>
							</tr>
						{:else if products.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center">
									<Package class="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>No products match this view</p>
									{#if data.search || data.status !== 'active'}
										<a
											href="/staff/catalog"
											class={cx(buttonStyles({ variant: 'outline', size: 'sm' }), 'mt-2')}
										>
											View active catalog
										</a>
									{:else}
										<button
											class={cx(buttonStyles({ tone: 'brand', size: 'sm' }), 'mt-2')}
											onclick={openAddModal}
										>
											Add your first product
										</button>
									{/if}
								</td>
							</tr>
						{:else}
							{#each products as product (product.id)}
								<tr>
									<td>
										<div class="flex items-center space-x-3">
											<div class="relative inline-flex align-middle">
												<div
													class="aspect-square h-12 w-12 overflow-hidden bg-surface-muted squircle-mask"
												>
													{#if product.imageUrl}
														<img
															src={product.imageUrl}
															alt={product.name}
															width="48"
															height="48"
															loading="lazy"
															decoding="async"
															class="h-full w-full object-cover"
														/>
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
											{#each product.variants as variant (variant.id)}
												<div>
													<span class="font-medium">{variant.size}</span>
													<span class="text-xs opacity-70">({variant.volumeMl}ml)</span>:
													{formatIdr(variant.sellingPrice / 100)}
												</div>
											{/each}
										</div>
									</td>
									<td>
										<div class="space-y-1 text-sm">
											{#each product.variants as variant (variant.id)}
												<div class="flex items-center gap-2">
													<span class="font-medium">{variant.size}:</span>
													<span
														class={badgeStyles(
															variant.stockQuantity < 10
																? 'danger'
																: variant.stockQuantity < 20
																	? 'caution'
																	: 'positive',
															'sm'
														)}
													>
														{variant.stockQuantity}
													</span>
												</div>
											{/each}
										</div>
									</td>
									<td>
										<span class={badgeStyles(product.isActive ? 'positive' : 'danger')}>
											{product.isActive ? 'Active' : 'Archived'}
										</span>
									</td>
									<td>
										<div class="flex gap-2">
											<button
												class={buttonStyles({ variant: 'ghost', size: 'xs' })}
												onclick={() => openEditModal(product)}
												disabled={loading}
												aria-label={`Edit ${product.name}`}
											>
												<Edit class="h-4 w-4" />
											</button>
											{#if product.isActive}
												<button
													class={cx(buttonStyles({ variant: 'ghost', size: 'xs' }), 'text-danger')}
													onclick={() => openArchiveModal(product)}
													disabled={loading}
													aria-label={`Archive ${product.name}`}
												>
													<Archive class="h-4 w-4" />
												</button>
											{:else}
												<button
													class={buttonStyles({ variant: 'outline', tone: 'positive', size: 'xs' })}
													onclick={() => restoreProduct(product.id)}
													disabled={loading}
												>
													<RotateCcw class="h-4 w-4" /> Restore
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	{#if data.pagination.totalPages > 1}
		<nav class="mt-6 flex items-center justify-between" aria-label="Catalog pages">
			{#if data.pagination.hasPrev}
				<a href={pageHref(data.pagination.page - 1)} class={buttonStyles({ variant: 'outline' })}>
					<ArrowLeft class="h-4 w-4" /> Previous
				</a>
			{:else}
				<span></span>
			{/if}
			<p class="text-sm text-ink/60">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</p>
			{#if data.pagination.hasNext}
				<a href={pageHref(data.pagination.page + 1)} class={buttonStyles({ variant: 'outline' })}>
					Next <ArrowRight class="h-4 w-4" />
				</a>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
</div>

<!-- Add Product Modal -->
{#if showAddModal}
	<div data-modal-root class={modalRootStyles}>
		<div class={cx(modalPanelStyles, 'max-w-3xl')}>
			<h3 class="mb-4 text-lg font-bold">Add New Product</h3>

			{#if error}
				<div class={cx(alertStyles('danger'), 'mb-4')}>
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			{/if}

			<div class="space-y-4">
				<!-- Basic Info -->
				<div>
					<label class={fieldLabelStyles}>
						<span>Product Name</span>
					</label>
					<input
						type="text"
						placeholder="Enter product name"
						class={inputStyles()}
						bind:value={formData.name}
					/>
				</div>

				<div>
					<label class={fieldLabelStyles}>
						<span>Description</span>
					</label>
					<textarea
						placeholder="Enter product description"
						class={textareaStyles()}
						bind:value={formData.description}
					></textarea>
				</div>

				<div>
					<label class={fieldLabelStyles}>
						<span>Category</span>
					</label>
					<select class={selectStyles()} bind:value={formData.category}>
						{#each categories as category (category)}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>

				<!-- Image Upload -->
				<div>
					<label class={fieldLabelStyles}>
						<span>Product Image</span>
					</label>

					{#if imagePreview}
						<div class="mb-4">
							<img
								src={imagePreview}
								alt="Product preview"
								class="mx-auto h-32 w-32 rounded-lg object-cover"
							/>
							<button
								type="button"
								class={cx(buttonStyles({ tone: 'danger', size: 'sm', block: true }), 'mt-2')}
								onclick={removeImage}
							>
								Remove Image
							</button>
						</div>
					{/if}

					<div class="flex gap-2">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onchange={handleFileSelect}
							class={cx(fileInputStyles, 'flex-1')}
							disabled={uploadingImage || loading}
						/>
					</div>

					<div class={fieldHintStyles}>
						<span>Or enter image URL</span>
					</div>
					<input
						type="url"
						placeholder="https://example.com/image.jpg"
						class={inputStyles()}
						bind:value={formData.imageUrl}
						disabled={imageFile !== null}
					/>
					<div class={fieldHintStyles}>
						<span>Accepted formats: JPEG, PNG, WebP (max 5MB)</span>
					</div>
				</div>

				<!-- Variants -->
				<div class={dividerStyles}>
					Variants & Pricing
					<button
						type="button"
						class={cx(buttonStyles({ tone: 'brand', size: 'xs' }), 'ml-2')}
						onclick={addVariant}
						disabled={formData.variants.length >= availableSizes.length}
					>
						<Plus class="h-3 w-3" />
						Add Variant
					</button>
				</div>

				{#if formData.variants.length === 0}
					<div class="py-4 text-center text-ink/50">
						<p>No variants added yet.</p>
						<button
							type="button"
							class={cx(buttonStyles({ tone: 'brand', size: 'sm' }), 'mt-2')}
							onclick={addVariant}
						>
							<Plus class="h-4 w-4" />
							Add First Variant
						</button>
					</div>
				{/if}

				{#each formData.variants as variant, i (variant.id ?? i)}
					<div class={cx(cardStyles, 'bg-surface-muted')}>
						<div class={cx(cardBodyStyles, 'p-4')}>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<select
										class={selectStyles({ size: 'sm' })}
										value={variant.size}
										disabled={Boolean(variant.id)}
										onchange={(e) => updateVariantSize(i, (e.target as HTMLSelectElement).value)}
									>
										{#each availableSizes as size (size)}
											<option
												value={size}
												disabled={formData.variants.some((v, idx) => idx !== i && v.size === size)}
											>
												Size {size}
											</option>
										{/each}
									</select>
									<span class="text-sm text-ink/50">Variant {i + 1}</span>
								</div>
								<button
									type="button"
									class={cx(buttonStyles({ variant: 'ghost', size: 'xs' }), 'text-danger')}
									onclick={() => removeVariant(i)}
									disabled={formData.variants.length === 1}
								>
									<X class="h-4 w-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class={fieldLabelStyles}>
										<span class="text-xs">Volume (ml)</span>
									</label>
									<input
										type="number"
										class={inputStyles({ size: 'sm' })}
										bind:value={variant.volumeMl}
										min="50"
										step="50"
									/>
								</div>
								<div>
									<label class={fieldLabelStyles}>
										<span class="text-xs">Cost Price (IDR)</span>
									</label>
									<input
										type="number"
										class={inputStyles({ size: 'sm' })}
										bind:value={variant.costPrice}
										min="0"
										step="100"
									/>
								</div>
								<div>
									<label class={fieldLabelStyles}>
										<span class="text-xs">Selling Price (IDR)</span>
									</label>
									<input
										type="number"
										class={inputStyles({ size: 'sm' })}
										bind:value={variant.sellingPrice}
										min="0"
										step="100"
									/>
								</div>
							</div>
							{#if variant.sellingPrice > 0 && variant.costPrice > 0}
								<div class="mt-2 text-xs text-ink/70">
									Profit Margin: {formatIdr(variant.sellingPrice - variant.costPrice)}
									({Math.round(
										((variant.sellingPrice - variant.costPrice) / variant.costPrice) * 100
									)}%)
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class={modalActionsStyles}>
				<button
					class={buttonStyles({ variant: 'ghost' })}
					onclick={() => {
						showAddModal = false;
						error = null;
					}}
					disabled={loading}>Cancel</button
				>
				<button
					class={buttonStyles({ tone: 'brand' })}
					onclick={handleAddProduct}
					disabled={loading}
				>
					{#if loading || uploadingImage}
						<span class={spinnerStyles('sm')}></span>
					{:else}
						<Save class="h-4 w-4" />
					{/if}
					Add Product
				</button>
			</div>
		</div>
		<button
			class={modalBackdropStyles}
			onclick={() => (showAddModal = false)}
			aria-label="Close modal"
		></button>
	</div>
{/if}

<!-- Edit Product Modal -->
{#if showEditModal}
	<div data-modal-root class={modalRootStyles}>
		<div class={cx(modalPanelStyles, 'max-w-3xl')}>
			<h3 class="mb-4 text-lg font-bold">Edit Product</h3>

			{#if error}
				<div class={cx(alertStyles('danger'), 'mb-4')}>
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			{/if}

			<div class="space-y-4">
				<!-- Basic Info -->
				<div>
					<label class={fieldLabelStyles}>
						<span>Product Name</span>
					</label>
					<input
						type="text"
						placeholder="Enter product name"
						class={inputStyles()}
						bind:value={formData.name}
					/>
				</div>

				<div>
					<label class={fieldLabelStyles}>
						<span>Description</span>
					</label>
					<textarea
						placeholder="Enter product description"
						class={textareaStyles()}
						bind:value={formData.description}
					></textarea>
				</div>

				<div>
					<label class={fieldLabelStyles}>
						<span>Category</span>
					</label>
					<select class={selectStyles()} bind:value={formData.category}>
						{#each categories as category (category)}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>

				<!-- Image Upload -->
				<div>
					<label class={fieldLabelStyles}>
						<span>Product Image</span>
					</label>

					{#if imagePreview}
						<div class="mb-4">
							<img
								src={imagePreview}
								alt="Product preview"
								class="mx-auto h-32 w-32 rounded-lg object-cover"
							/>
							<button
								type="button"
								class={cx(buttonStyles({ tone: 'danger', size: 'sm', block: true }), 'mt-2')}
								onclick={removeImage}
							>
								Remove Image
							</button>
						</div>
					{/if}

					<div class="flex gap-2">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onchange={handleFileSelect}
							class={cx(fileInputStyles, 'flex-1')}
							disabled={uploadingImage || loading}
						/>
					</div>

					<div class={fieldHintStyles}>
						<span>Or enter image URL</span>
					</div>
					<input
						type="url"
						placeholder="https://example.com/image.jpg"
						class={inputStyles()}
						bind:value={formData.imageUrl}
						disabled={imageFile !== null}
					/>
					<div class={fieldHintStyles}>
						<span>Accepted formats: JPEG, PNG, WebP (max 5MB)</span>
					</div>
				</div>

				<!-- Variants -->
				<div class={dividerStyles}>
					Variants & Pricing
					<button
						type="button"
						class={cx(buttonStyles({ tone: 'brand', size: 'xs' }), 'ml-2')}
						onclick={addVariant}
						disabled={formData.variants.length >= availableSizes.length}
					>
						<Plus class="h-3 w-3" />
						Add Variant
					</button>
				</div>

				{#if formData.variants.length === 0}
					<div class="py-4 text-center text-ink/50">
						<p>No variants added yet.</p>
						<button
							type="button"
							class={cx(buttonStyles({ tone: 'brand', size: 'sm' }), 'mt-2')}
							onclick={addVariant}
						>
							<Plus class="h-4 w-4" />
							Add First Variant
						</button>
					</div>
				{/if}

				{#each formData.variants as variant, i (variant.id ?? i)}
					<div class={cx(cardStyles, 'bg-surface-muted')}>
						<div class={cx(cardBodyStyles, 'p-4')}>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<select
										class={selectStyles({ size: 'sm' })}
										value={variant.size}
										disabled={Boolean(variant.id)}
										onchange={(e) => updateVariantSize(i, (e.target as HTMLSelectElement).value)}
									>
										{#each availableSizes as size (size)}
											<option
												value={size}
												disabled={formData.variants.some((v, idx) => idx !== i && v.size === size)}
											>
												Size {size}
											</option>
										{/each}
									</select>
									<span class="text-sm text-ink/50">Variant {i + 1}</span>
								</div>
								<button
									type="button"
									class={cx(buttonStyles({ variant: 'ghost', size: 'xs' }), 'text-danger')}
									onclick={() => removeVariant(i)}
									disabled={formData.variants.length === 1}
								>
									<X class="h-4 w-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class={fieldLabelStyles}>
										<span class="text-xs">Volume (ml)</span>
									</label>
									<input
										type="number"
										class={inputStyles({ size: 'sm' })}
										bind:value={variant.volumeMl}
										min="50"
										step="50"
									/>
								</div>
								<div>
									<label class={fieldLabelStyles}>
										<span class="text-xs">Cost Price (IDR)</span>
									</label>
									<input
										type="number"
										class={inputStyles({ size: 'sm' })}
										bind:value={variant.costPrice}
										min="0"
										step="100"
									/>
								</div>
								<div>
									<label class={fieldLabelStyles}>
										<span class="text-xs">Selling Price (IDR)</span>
									</label>
									<input
										type="number"
										class={inputStyles({ size: 'sm' })}
										bind:value={variant.sellingPrice}
										min="0"
										step="100"
									/>
								</div>
							</div>
							{#if variant.sellingPrice > 0 && variant.costPrice > 0}
								<div class="mt-2 text-xs text-ink/70">
									Profit Margin: {formatIdr(variant.sellingPrice - variant.costPrice)}
									({Math.round(
										((variant.sellingPrice - variant.costPrice) / variant.costPrice) * 100
									)}%)
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class={modalActionsStyles}>
				<button
					class={buttonStyles({ variant: 'ghost' })}
					onclick={() => {
						showEditModal = false;
						error = null;
					}}
					disabled={loading}>Cancel</button
				>
				<button
					class={buttonStyles({ tone: 'brand' })}
					onclick={handleEditProduct}
					disabled={loading}
				>
					{#if loading || uploadingImage}
						<span class={spinnerStyles('sm')}></span>
					{:else}
						<Save class="h-4 w-4" />
					{/if}
					Save Changes
				</button>
			</div>
		</div>
		<button
			class={modalBackdropStyles}
			onclick={() => (showEditModal = false)}
			aria-label="Close modal"
		></button>
	</div>
{/if}

<!-- Archive Confirmation Modal -->
{#if showArchiveModal}
	<div data-modal-root class={modalRootStyles}>
		<div class={modalPanelStyles}>
			<h3 class="mb-4 text-lg font-bold">Archive Product</h3>

			{#if error}
				<div class={cx(alertStyles('danger'), 'mb-4')}>
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			{/if}

			<div class={cx(alertStyles('caution'), 'mb-4')}>
				<AlertCircle class="h-6 w-6" />
				<span>This removes the product from the menu and POS without erasing its history.</span>
			</div>

			{#if selectedProduct}
				<p class="mb-4">
					Archive <strong>{selectedProduct.name}</strong>? You can restore it from the Archived
					view.
				</p>
			{/if}

			<div class={modalActionsStyles}>
				<button
					class={buttonStyles({ variant: 'ghost' })}
					onclick={() => {
						showArchiveModal = false;
						error = null;
					}}
					disabled={loading}>Cancel</button
				>
				<button
					class={buttonStyles({ tone: 'danger' })}
					onclick={handleArchiveProduct}
					disabled={loading}
				>
					{#if loading}
						<span class={spinnerStyles('sm')}></span>
					{:else}
						<Archive class="h-4 w-4" />
					{/if}
					Archive Product
				</button>
			</div>
		</div>
		<button
			class={modalBackdropStyles}
			onclick={() => (showArchiveModal = false)}
			aria-label="Close modal"
		></button>
	</div>
{/if}
