<script lang="ts">
	import { Save, X } from '@lucide/svelte';
	import { focusTrap } from '$lib/actions/focus-trap';
	import type { CatalogProduct } from '$lib/product';
	import {
		catalogCategories,
		createCatalogForm,
		createEmptyCatalogForm,
		toCatalogPayload,
		validateCatalogForm
	} from '$lib/catalog-form';
	import { saveCatalogProduct, uploadCatalogImage } from '$lib/catalog-client';
	import CatalogImageField from '$lib/components/catalog/CatalogImageField.svelte';
	import CatalogVariantEditor from '$lib/components/catalog/CatalogVariantEditor.svelte';
	import {
		alertStyles,
		buttonStyles,
		cx,
		fieldLabelStyles,
		inputStyles,
		modalActionsStyles,
		modalBackdropStyles,
		modalPanelStyles,
		modalRootStyles,
		selectStyles,
		spinnerStyles,
		textareaStyles
	} from '$lib/styles';

	interface Props {
		product?: CatalogProduct | null;
		onClose: () => void;
		onSaved: (message: string) => void | Promise<void>;
	}

	let { product = null, onClose, onSaved }: Props = $props();
	const isEditing = Boolean(product);
	const idPrefix = isEditing ? 'edit-product' : 'add-product';
	const title = isEditing ? 'Edit product' : 'Add product';
	let formData = $state(product ? createCatalogForm(product) : createEmptyCatalogForm());
	let imageFile = $state<File | null>(null);
	let imagePreview = $state<string | null>(product?.imageUrl ?? null);
	let loading = $state(false);
	let error = $state('');

	function close() {
		if (!loading) onClose();
	}

	async function submit() {
		if (loading) return;
		error = validateCatalogForm(formData) ?? '';
		if (error) return;

		loading = true;
		try {
			const value = imagePreview || imageFile ? formData : { ...formData, imageUrl: '' };
			const savedProduct = await saveCatalogProduct(
				toCatalogPayload(value, !isEditing),
				product?.id
			);
			let message = isEditing ? 'Product updated successfully.' : 'Product added successfully.';
			if (imageFile) {
				try {
					await uploadCatalogImage(savedProduct.id, imageFile);
					message = isEditing
						? 'Product and image updated successfully.'
						: 'Product and image added successfully.';
				} catch (imageError) {
					console.error('Product saved, but image upload failed:', imageError);
					message = 'Product saved, but its image could not be uploaded.';
				}
			}
			await onSaved(message);
			onClose();
		} catch (submissionError) {
			error =
				submissionError instanceof Error
					? submissionError.message
					: 'The product could not be saved.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') close();
	}}
/>

<div data-modal-root class={modalRootStyles}>
	<div
		class={cx(modalPanelStyles, 'max-w-3xl')}
		role="dialog"
		aria-modal="true"
		aria-labelledby={`${idPrefix}-title`}
		tabindex="-1"
		use:focusTrap
	>
		<form
			onsubmit={(event) => {
				event.preventDefault();
				void submit();
			}}
		>
			<div class="mb-4 flex items-center justify-between gap-4">
				<h3 id={`${idPrefix}-title`} class="text-lg font-bold">{title}</h3>
				<button
					type="button"
					class={buttonStyles({ variant: 'ghost', shape: 'square' })}
					onclick={close}
					disabled={loading}
					aria-label={`Close ${title.toLowerCase()} dialog`}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if error}
				<div class={cx(alertStyles('danger'), 'mb-4')} role="alert">{error}</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for={`${idPrefix}-name`} class={fieldLabelStyles}>Product name</label>
					<input
						id={`${idPrefix}-name`}
						data-autofocus
						class={inputStyles({ full: true })}
						bind:value={formData.name}
						maxlength="120"
						required
					/>
				</div>
				<div>
					<label for={`${idPrefix}-description`} class={fieldLabelStyles}>Description</label>
					<textarea
						id={`${idPrefix}-description`}
						class={textareaStyles({ full: true })}
						bind:value={formData.description}
						maxlength="1000"
					></textarea>
				</div>
				<div>
					<label for={`${idPrefix}-category`} class={fieldLabelStyles}>Category</label>
					<select
						id={`${idPrefix}-category`}
						class={selectStyles({ full: true })}
						bind:value={formData.category}
					>
						{#each catalogCategories as category (category)}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>

				<CatalogImageField
					bind:imageFile
					bind:imagePreview
					{idPrefix}
					onError={(message) => (error = message)}
				/>
				<CatalogVariantEditor
					bind:variants={formData.variants}
					{idPrefix}
					onError={(message) => (error = message)}
				/>
			</div>

			<div class={modalActionsStyles}>
				<button
					type="button"
					class={buttonStyles({ variant: 'ghost' })}
					onclick={close}
					disabled={loading}>Cancel</button
				>
				<button type="submit" class={buttonStyles({ tone: 'brand' })} disabled={loading}>
					{#if loading}<span class={spinnerStyles('sm')}></span>{:else}<Save class="h-4 w-4" />{/if}
					{loading ? 'Saving…' : title}
				</button>
			</div>
		</form>
	</div>
	<button class={modalBackdropStyles} type="button" onclick={close} aria-label={`Close ${title}`}
	></button>
</div>
