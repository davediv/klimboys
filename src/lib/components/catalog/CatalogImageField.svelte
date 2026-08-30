<script lang="ts">
	import { Package, Upload, X } from '@lucide/svelte';
	import {
		buttonStyles,
		cx,
		fieldHintStyles,
		fieldLabelStyles,
		fileInputStyles
	} from '$lib/styles';

	interface Props {
		imageFile: File | null;
		imagePreview: string | null;
		idPrefix: string;
		onError: (message: string) => void;
	}

	let { imageFile = $bindable(), imagePreview = $bindable(), idPrefix, onError }: Props = $props();

	function selectFile(event: Event) {
		const file =
			event.currentTarget instanceof HTMLInputElement ? event.currentTarget.files?.[0] : null;
		if (!file) return;
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			onError('Only JPEG, PNG, and WebP images are allowed.');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			onError('Product images must be 5 MB or smaller.');
			return;
		}

		imageFile = file;
		const reader = new FileReader();
		reader.onload = () => {
			imagePreview = typeof reader.result === 'string' ? reader.result : null;
		};
		reader.readAsDataURL(file);
	}

	function removeImage() {
		imageFile = null;
		imagePreview = null;
	}
</script>

<div>
	<label for={`${idPrefix}-image`} class={fieldLabelStyles}>Product image</label>
	{#if imagePreview}
		<div class="mt-2 flex items-start gap-3">
			<img
				src={imagePreview}
				alt="Product preview"
				class="h-24 w-24 rounded-lg object-cover"
				width="96"
				height="96"
			/>
			<button
				type="button"
				class={cx(buttonStyles({ variant: 'outline', tone: 'danger', size: 'sm' }))}
				onclick={removeImage}
			>
				<X class="h-4 w-4" /> Remove image
			</button>
		</div>
	{:else}
		<div class="mt-2 flex h-24 w-24 items-center justify-center rounded-lg bg-surface-muted">
			<Package class="h-10 w-10 text-ink/30" />
		</div>
	{/if}
	<label
		for={`${idPrefix}-image`}
		class={cx(buttonStyles({ variant: 'outline', size: 'sm' }), 'mt-3')}
	>
		<Upload class="h-4 w-4" /> Choose image
	</label>
	<input
		id={`${idPrefix}-image`}
		type="file"
		class={cx(fileInputStyles, 'sr-only')}
		accept="image/jpeg,image/png,image/webp"
		onchange={selectFile}
	/>
	<p class={cx(fieldHintStyles, 'mt-1')}>JPEG, PNG, or WebP; up to 5 MB.</p>
</div>
