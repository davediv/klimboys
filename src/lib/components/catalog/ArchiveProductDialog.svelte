<script lang="ts">
	import { AlertCircle, Archive, X } from '@lucide/svelte';
	import type { CatalogProduct } from '$lib/product';
	import { archiveCatalogProduct } from '$lib/catalog-client';
	import {
		alertStyles,
		buttonStyles,
		cx,
		modalActionsStyles,
		modalBackdropStyles,
		modalPanelStyles,
		modalRootStyles,
		spinnerStyles
	} from '$lib/styles';

	interface Props {
		product: CatalogProduct;
		onClose: () => void;
		onArchived: () => void | Promise<void>;
	}

	let { product, onClose, onArchived }: Props = $props();
	let loading = $state(false);
	let error = $state('');

	function close() {
		if (!loading) onClose();
	}

	async function archiveProduct() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			await archiveCatalogProduct(product.id);
			await onArchived();
			onClose();
		} catch (archiveError) {
			error =
				archiveError instanceof Error ? archiveError.message : 'The product could not be archived.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && close()} />

<div data-modal-root class={modalRootStyles}>
	<div
		class={modalPanelStyles}
		role="dialog"
		aria-modal="true"
		aria-labelledby="archive-product-title"
	>
		<div class="mb-4 flex items-center justify-between gap-4">
			<h3 id="archive-product-title" class="text-lg font-bold">Archive product</h3>
			<button
				type="button"
				class={buttonStyles({ variant: 'ghost', shape: 'square' })}
				onclick={close}
				disabled={loading}
				aria-label="Close archive product dialog"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		{#if error}<div class={cx(alertStyles('danger'), 'mb-4')} role="alert">{error}</div>{/if}
		<div class={cx(alertStyles('caution'), 'mb-4')}>
			<AlertCircle class="h-6 w-6" />
			<span>This removes the product from the menu and POS without erasing its history.</span>
		</div>
		<p class="mb-4">
			Archive <strong>{product.name}</strong>? You can restore it from the Archived view.
		</p>
		<div class={modalActionsStyles}>
			<button
				type="button"
				class={buttonStyles({ variant: 'ghost' })}
				onclick={close}
				disabled={loading}>Cancel</button
			>
			<button
				type="button"
				class={buttonStyles({ tone: 'danger' })}
				onclick={archiveProduct}
				disabled={loading}
			>
				{#if loading}<span class={spinnerStyles('sm')}></span>{:else}<Archive
						class="h-4 w-4"
					/>{/if}
				{loading ? 'Archiving…' : 'Archive product'}
			</button>
		</div>
	</div>
	<button
		class={modalBackdropStyles}
		type="button"
		onclick={close}
		aria-label="Close archive dialog"
	></button>
</div>
