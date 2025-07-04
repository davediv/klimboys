<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { enhance } from '$app/forms';
	import { UserPlus, Edit2, Trash2, Shield, User, Clock } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let selectedUser = $state<(typeof data.users)[0] | null>(null);
	let loading = $state(false);

	function openEditModal(user: (typeof data.users)[0]) {
		selectedUser = user;
		showEditModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		selectedUser = null;
	}
</script>

<svelte:head>
	<title>User Management - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold">User Management</h1>
			<p class="text-base-content/70 mt-1">Manage admin and cashier accounts</p>
		</div>
		<Button variant="primary" icon={UserPlus} onclick={() => (showCreateModal = true)}>
			Add User
		</Button>
	</div>

	<!-- Users Table -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>User</th>
						<th>Role</th>
						<th>Status</th>
						<th>Last Login</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user}
						<tr>
							<td>
								<div>
									<div class="font-medium">{user.name}</div>
									<div class="text-base-content/70 text-sm">{user.email}</div>
								</div>
							</td>
							<td>
								<span class="badge {user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">
									{#if user.role === 'admin'}
										<Shield class="mr-1 h-3 w-3" />
									{:else}
										<User class="mr-1 h-3 w-3" />
									{/if}
									{user.role}
								</span>
							</td>
							<td>
								<span class="badge {user.isActive ? 'badge-success' : 'badge-error'}">
									{user.isActive ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td>
								{#if user.lastLoginAt}
									<div class="flex items-center gap-1 text-sm">
										<Clock class="h-3 w-3" />
										{jakartaTime.relative(user.lastLoginAt)}
									</div>
								{:else}
									<span class="text-base-content/50">Never</span>
								{/if}
							</td>
							<td>
								<span class="text-sm">{jakartaTime.dateTime(user.createdAt)}</span>
							</td>
							<td>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										square
										icon={Edit2}
										onclick={() => openEditModal(user)}
									/>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													notifications.success('User deleted', 'The user has been deactivated');
													// Update the page data without a full reload
													await update();
												}
											};
										}}
									>
										<input type="hidden" name="userId" value={user.id} />
										<Button
											type="submit"
											size="sm"
											variant="ghost"
											square
											icon={Trash2}
											onclick={(e) => {
												if (!confirm('Are you sure you want to deactivate this user?')) {
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
							<td colspan="6" class="text-center text-base-content/50 py-8">
								No users found. You're the only user in the system.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Create User Modal -->
<dialog class="modal" class:modal-open={showCreateModal}>
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Create New User</h3>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						notifications.success('User created', 'The new user can now log in');
						closeModals();
						// Update the page data without a full reload
						await update();
					}
				};
			}}
		>
			<div class="space-y-4">
				<div class="form-control">
					<label class="label" for="create-name">
						<span class="label-text">Full Name</span>
					</label>
					<input id="create-name" name="name" type="text" class="input input-bordered" required />
				</div>

				<div class="form-control">
					<label class="label" for="create-email">
						<span class="label-text">Email Address</span>
					</label>
					<input
						id="create-email"
						name="email"
						type="email"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control">
					<label class="label" for="create-password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="create-password"
						name="password"
						type="password"
						class="input input-bordered"
						required
						minlength="8"
					/>
					<label class="label">
						<span class="label-text-alt">Minimum 8 characters</span>
					</label>
				</div>

				<div class="form-control">
					<label class="label" for="create-role">
						<span class="label-text">Role</span>
					</label>
					<select id="create-role" name="role" class="select select-bordered" required>
						<option value="cashier">Cashier</option>
						<option value="admin">Admin</option>
					</select>
				</div>
			</div>

			<div class="modal-action">
				<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
				<Button type="submit" variant="primary" {loading} loadingText="Creating...">
					Create User
				</Button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>

<!-- Edit User Modal -->
<dialog class="modal" class:modal-open={showEditModal}>
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Edit User</h3>
		{#if selectedUser}
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						if (result.type === 'success') {
							notifications.success('User updated', 'The user details have been updated');
							closeModals();
							// Update the page data without a full reload
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="userId" value={selectedUser.id} />

				<div class="space-y-4">
					<div class="form-control">
						<label class="label" for="edit-name">
							<span class="label-text">Full Name</span>
						</label>
						<input
							id="edit-name"
							name="name"
							type="text"
							class="input input-bordered"
							value={selectedUser.name}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="edit-email">
							<span class="label-text">Email Address</span>
						</label>
						<input
							id="edit-email"
							name="email"
							type="email"
							class="input input-bordered"
							value={selectedUser.email}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="edit-role">
							<span class="label-text">Role</span>
						</label>
						<select
							id="edit-role"
							name="role"
							class="select select-bordered"
							value={selectedUser.role}
						>
							<option value="cashier">Cashier</option>
							<option value="admin">Admin</option>
						</select>
					</div>

					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text">Active Status</span>
							<input
								type="checkbox"
								name="isActive"
								class="toggle toggle-success"
								checked={selectedUser.isActive}
								value="true"
							/>
						</label>
					</div>
				</div>

				<div class="modal-action">
					<Button type="button" variant="ghost" onclick={closeModals}>Cancel</Button>
					<Button type="submit" variant="primary" {loading} loadingText="Updating...">
						Update User
					</Button>
				</div>
			</form>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeModals}>close</button>
	</form>
</dialog>
