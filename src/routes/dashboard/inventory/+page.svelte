<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import {
		Plus,
		Edit2,
		Trash2,
		Package,
		AlertTriangle,
		TrendingUp,
		TrendingDown,
		Calendar,
		BarChart3,
		FlaskConical
	} from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let showAdjustModal = $state(false);
	let selectedInventory = $state<(typeof data.inventoryItems)[0] | null>(null);
	let loading = $state(false);

	const units = [
		{ value: 'ml', label: 'Milliliters (ml)' },
		{ value: 'l', label: 'Liters (l)' },
		{ value: 'g', label: 'Grams (g)' },
		{ value: 'kg', label: 'Kilograms (kg)' },
		{ value: 'pcs', label: 'Pieces (pcs)' }
	];

	function getStockStatus(item: (typeof data.inventoryItems)[0]) {
		if (item.currentStock === 0) {
			return { label: 'Out of Stock', class: 'badge-error' };
		} else if (item.currentStock <= item.minimumStock) {
			return { label: 'Low Stock', class: 'badge-warning' };
		}
		return { label: 'In Stock', class: 'badge-success' };
	}

	function formatUnit(value: number, unit: string) {
		return `${value} ${unit}`;
	}

	function openEditModal(item: (typeof data.inventoryItems)[0]) {
		selectedInventory = item;
		showEditModal = true;
	}

	function openAdjustModal(item: (typeof data.inventoryItems)[0]) {
		selectedInventory = item;
		showAdjustModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		showAdjustModal = false;
		selectedInventory = null;
	}
</script>

<svelte:head>
	<title>Inventory Management - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">Inventory Management</h1>
			<p class="text-base-content/70 mt-1">Track and manage ingredient stock levels</p>
			<div class="alert mt-2 max-w-2xl">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-info h-6 w-6 shrink-0"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span class="text-sm"
					>Products are automatically added as inventory items when created. Raw materials should be
					added manually.</span
				>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="ghost" href="/dashboard/products/recipes" icon={FlaskConical}>
				Product Recipes
			</Button>
			<Button variant="ghost" href="/dashboard/inventory/movements" icon={BarChart3}>
				Movement History
			</Button>
			<Button variant="primary" icon={Plus} onclick={() => (showCreateModal = true)}>
				Add Inventory Item
			</Button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-primary">
					<Package class="h-8 w-8" />
				</div>
				<div class="stat-title">Total Items</div>
				<div class="stat-value">{data.inventoryItems.length}</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-warning">
					<AlertTriangle class="h-8 w-8" />
				</div>
				<div class="stat-title">Low Stock Items</div>
				<div class="stat-value text-warning">{data.lowStockCount}</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-figure text-info">
					<BarChart3 class="h-8 w-8" />
				</div>
				<div class="stat-title">Recent Movements</div>
				<div class="stat-value">{data.recentMovements.length}</div>
			</div>
		</div>
	</div>

	<!-- Inventory Table -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Item</th>
						<th>Current Stock</th>
						<th>Minimum Stock</th>
						<th>Status</th>
						<th>Last Restock</th>
						<th>Used In</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.inventoryItems as item}
						{@const status = getStockStatus(item)}
						<tr>
							<td>
								<div class="flex items-center gap-2">
									<Package class="text-base-content/50 h-4 w-4" />
									<div>
										<span class="font-medium">{item.name}</span>
										{#if item.unit === 'pcs'}
											<span class="badge badge-primary badge-xs ml-2">Product</span>
										{:else}
											<span class="badge badge-secondary badge-xs ml-2">Material</span>
										{/if}
									</div>
								</div>
							</td>
							<td>
								<span class="font-semibold">{formatUnit(item.currentStock, item.unit)}</span>
							</td>
							<td>
								<span class="text-sm">{formatUnit(item.minimumStock, item.unit)}</span>
							</td>
							<td>
								<div class="badge {status.class} badge-sm">{status.label}</div>
							</td>
							<td>
								{#if item.lastRestockDate}
									<div class="flex items-center gap-1">
										<Calendar class="text-base-content/50 h-4 w-4" />
										<span class="text-sm">{jakartaTime.dayDate(item.lastRestockDate)}</span>
									</div>
								{:else}
									<span class="text-base-content/50 text-sm">Never</span>
								{/if}
							</td>
							<td>
								{#if item.recipes && item.recipes.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each item.recipes.slice(0, 2) as recipe}
											<span class="badge badge-ghost badge-sm">{recipe.product?.title}</span>
										{/each}
										{#if item.recipes.length > 2}
											<span class="badge badge-ghost badge-sm">+{item.recipes.length - 2}</span>
										{/if}
									</div>
								{:else}
									<span class="text-base-content/50 text-sm">Not used</span>
								{/if}
							</td>
							<td>
								<div class="flex gap-2">
									<div class="tooltip" data-tip="Adjust Stock">
										<Button size="sm" variant="ghost" square onclick={() => openAdjustModal(item)}>
											{#if item.currentStock > item.minimumStock}
												<TrendingUp class="h-4 w-4" />
											{:else}
												<TrendingDown class="h-4 w-4" />
											{/if}
										</Button>
									</div>
									<Button
										size="sm"
										variant="ghost"
										square
										icon={Edit2}
										onclick={() => openEditModal(item)}
									/>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													notifications.success('Item deleted', 'Inventory item has been removed');
													await update();
												} else if (result.type === 'failure' && result.data?.message) {
													notifications.error('Delete failed', result.data.message);
												}
											};
										}}
									>
										<input type="hidden" name="inventoryId" value={item.id} />
										<Button
											type="submit"
											size="sm"
											variant="ghost"
											square
											icon={Trash2}
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this inventory item?')) {
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
							<td colspan="7" class="py-8 text-center text-base-content/50">
								No inventory items found. Add your first item to start tracking stock.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Recent Stock Movements -->
	{#if data.recentMovements.length > 0}
		<div class="bg-base-100 rounded-box p-6 shadow">
			<h2 class="mb-4 text-xl font-bold">Recent Stock Movements</h2>
			<div class="space-y-2">
				{#each data.recentMovements as movement}
					<div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
						<div class="flex items-center gap-3">
							{#if movement.type === 'in'}
								<TrendingUp class="text-success h-5 w-5" />
							{:else if movement.type === 'out'}
								<TrendingDown class="text-error h-5 w-5" />
							{:else}
								<BarChart3 class="text-info h-5 w-5" />
							{/if}
							<div>
								<div class="font-medium">
									{movement.inventory?.name} - {movement.type === 'in'
										? '+'
										: '-'}{movement.quantity}
									{movement.inventory?.unit}
								</div>
								<div class="text-base-content/70 text-sm">
									{movement.reason} • by {movement.createdByUser?.name}
								</div>
							</div>
						</div>
						<div class="text-base-content/50 text-sm">
							{jakartaTime.relative(movement.createdAt)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Create Inventory Modal -->
<dialog class="modal" class:modal-open={showCreateModal}>
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Add New Inventory Item</h3>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						notifications.success('Item created', 'New inventory item has been added');
						closeModals();
						await update();
					}
				};
			}}
		>
			<div class="space-y-4">
				<div class="form-control">
					<label class="label" for="create-name">
						<span class="label-text">Item Name</span>
					</label>
					<input
						id="create-name"
						name="name"
						type="text"
						class="input input-bordered"
						placeholder="e.g. Fresh Milk"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="create-unit">
						<span class="label-text">Unit of Measurement</span>
					</label>
					<select id="create-unit" name="unit" class="select select-bordered" required>
						<option value="">Select unit</option>
						{#each units as unit}
							<option value={unit.value}>{unit.label}</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="create-current">
							<span class="label-text">Current Stock</span>
						</label>
						<input
							id="create-current"
							name="currentStock"
							type="number"
							step="0.01"
							min="0"
							class="input input-bordered"
							value="0"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="create-minimum">
							<span class="label-text">Minimum Stock</span>
						</label>
						<input
							id="create-minimum"
							name="minimumStock"
							type="number"
							step="0.01"
							min="0"
							class="input input-bordered"
							value="0"
							required
						/>
					</div>
				</div>
			</div>

			<div class="modal-action">
				<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
				<Button type="submit" variant="primary" {loading} loadingText="Creating...">
					Create Item
				</Button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>

<!-- Edit Inventory Modal -->
<dialog class="modal" class:modal-open={showEditModal}>
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Edit Inventory Item</h3>
		{#if selectedInventory}
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Item updated', 'Inventory item has been updated');
							closeModals();
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="inventoryId" value={selectedInventory.id} />

				<div class="space-y-4">
					<div class="form-control">
						<label class="label" for="edit-name">
							<span class="label-text">Item Name</span>
						</label>
						<input
							id="edit-name"
							name="name"
							type="text"
							class="input input-bordered"
							value={selectedInventory.name}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="edit-unit">
							<span class="label-text">Unit of Measurement</span>
						</label>
						<select
							id="edit-unit"
							name="unit"
							class="select select-bordered"
							value={selectedInventory.unit}
							required
						>
							{#each units as unit}
								<option value={unit.value}>{unit.label}</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="edit-minimum">
							<span class="label-text">Minimum Stock</span>
						</label>
						<input
							id="edit-minimum"
							name="minimumStock"
							type="number"
							step="0.01"
							min="0"
							class="input input-bordered"
							value={selectedInventory.minimumStock}
							required
						/>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Current Stock</span>
						</label>
						<input
							type="number"
							class="input input-bordered"
							value={selectedInventory.currentStock}
							disabled
						/>
						<label class="label">
							<span class="label-text-alt">Use stock adjustment to change current stock</span>
						</label>
					</div>
				</div>

				<div class="modal-action">
					<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
					<Button type="submit" variant="primary" {loading} loadingText="Updating...">
						Update Item
					</Button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>

<!-- Stock Adjustment Modal -->
<dialog class="modal" class:modal-open={showAdjustModal}>
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Adjust Stock Level</h3>
		{#if selectedInventory}
			<form
				method="POST"
				action="?/adjust"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('Stock adjusted', 'Stock level has been updated');
							closeModals();
							await update();
						} else if (result.type === 'failure' && result.data?.message) {
							notifications.error('Adjustment failed', result.data.message);
						}
					};
				}}
			>
				<input type="hidden" name="inventoryId" value={selectedInventory.id} />

				<div class="space-y-4">
					<div class="alert alert-info">
						<span
							>Current stock: <strong
								>{formatUnit(selectedInventory.currentStock, selectedInventory.unit)}</strong
							></span
						>
					</div>

					<div class="form-control">
						<label class="label" for="adjust-quantity">
							<span class="label-text">Adjustment Quantity</span>
						</label>
						<input
							id="adjust-quantity"
							name="quantity"
							type="number"
							step="0.01"
							class="input input-bordered"
							placeholder="Use negative for stock out"
							required
						/>
						<label class="label">
							<span class="label-text-alt">Positive = stock in, Negative = stock out</span>
						</label>
					</div>

					<div class="form-control">
						<label class="label" for="adjust-reason">
							<span class="label-text">Reason for Adjustment</span>
						</label>
						<textarea
							id="adjust-reason"
							name="reason"
							class="textarea textarea-bordered"
							rows="3"
							placeholder="e.g. Stock count correction, Spillage, Expired items"
							required
						></textarea>
					</div>
				</div>

				<div class="modal-action">
					<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
					<Button type="submit" variant="primary" {loading} loadingText="Adjusting...">
						Adjust Stock
					</Button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>
