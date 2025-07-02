<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import { Plus, Edit2, Trash2, Tag } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';

	export let data: PageData;

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedCategory = $state<typeof data.categories[0] | null>(null);
	let loading = $state(false);

	function openEditModal(category: typeof data.categories[0]) {
		selectedCategory = category;
		showEditModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		selectedCategory = null;
	}
</script>

<svelte:head>
	<title>Categories - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold">Categories</h1>
			<p class="text-base-content/70 mt-1">Organize your products into categories</p>
		</div>
		<Button
			variant="primary"
			icon={Plus}
			onclick={() => (showCreateModal = true)}
		>
			Add Category
		</Button>
	</div>

	<!-- Categories Table -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Category</th>
						<th>Description</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.categories as category}
						<tr>
							<td>
								<div class="flex items-center gap-2">
									<Tag class="w-4 h-4 text-base-content/50" />
									<span class="font-medium">{category.name}</span>
								</div>
							</td>
							<td>
								<span class="text-sm text-base-content/70">{category.description || '-'}</span>
							</td>
							<td>
								<span class="text-sm">{jakartaTime.dateTime(category.createdAt)}</span>
							</td>
							<td>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										square
										icon={Edit2}
										onclick={() => openEditModal(category)}
									/>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													notifications.success('Category deleted', 'The category has been removed');
													await update();
												} else if (result.type === 'failure' && result.data?.message) {
													notifications.error('Delete failed', result.data.message);
												}
											};
										}}
									>
										<input type="hidden" name="categoryId" value={category.id} />
										<Button
											type="submit"
											size="sm"
											variant="ghost"
											square
											icon={Trash2}
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this category?')) {
													e.preventDefault();
												}
											}}
										/>
									</form>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="text-center text-base-content/50 py-8">
								No categories found. Create your first category to organize products.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Create Category Modal -->
<dialog class="modal" class:modal-open={showCreateModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Create New Category</h3>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						notifications.success('Category created', 'The new category has been added');
						closeModals();
						await update();
					}
				};
			}}
		>
			<div class="space-y-4">
				<div class="form-control">
					<label class="label" for="create-name">
						<span class="label-text">Category Name</span>
					</label>
					<input
						id="create-name"
						name="name"
						type="text"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="create-description">
						<span class="label-text">Description (optional)</span>
					</label>
					<textarea
						id="create-description"
						name="description"
						class="textarea textarea-bordered"
						rows="3"
					></textarea>
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
					Create Category
				</Button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>

<!-- Edit Category Modal -->
<dialog class="modal" class:modal-open={showEditModal}>
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Edit Category</h3>
		{#if selectedCategory}
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Category updated', 'The category has been updated');
							closeModals();
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="categoryId" value={selectedCategory.id} />
				
				<div class="space-y-4">
					<div class="form-control">
						<label class="label" for="edit-name">
							<span class="label-text">Category Name</span>
						</label>
						<input
							id="edit-name"
							name="name"
							type="text"
							class="input input-bordered"
							value={selectedCategory.name}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="edit-description">
							<span class="label-text">Description (optional)</span>
						</label>
						<textarea
							id="edit-description"
							name="description"
							class="textarea textarea-bordered"
							rows="3"
							value={selectedCategory.description || ''}
						></textarea>
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
						Update Category
					</Button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>