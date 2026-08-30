<script lang="ts">
	import { Plus, X } from '@lucide/svelte';
	import { formatIdr } from '$lib/format';
	import { catalogSizes, type CatalogVariantFormValue } from '$lib/catalog-form';
	import {
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		cx,
		fieldLabelStyles,
		inputStyles,
		selectStyles
	} from '$lib/styles';

	interface Props {
		variants: CatalogVariantFormValue[];
		idPrefix: string;
		onError: (message: string) => void;
	}

	let { variants = $bindable(), idPrefix, onError }: Props = $props();

	function addVariant() {
		const usedSizes = variants.map((variant) => variant.size);
		const size = catalogSizes.find((candidate) => !usedSizes.includes(candidate));
		if (!size) {
			onError('Every available size is already in this product.');
			return;
		}
		variants = [
			...variants,
			{
				size,
				volumeMl: size === 'M' ? 350 : size === 'L' ? 500 : size === 'XL' ? 750 : 250,
				costPrice: 0,
				sellingPrice: 0
			}
		];
	}

	function removeVariant(index: number) {
		if (variants.length === 1) {
			onError('At least one variant is required.');
			return;
		}
		variants = variants.filter((_, candidateIndex) => candidateIndex !== index);
	}

	function updateSize(index: number, size: string) {
		variants[index].size = size;
		variants[index].volumeMl = size === 'M' ? 350 : size === 'L' ? 500 : size === 'XL' ? 750 : 250;
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h4 class="font-semibold">Variants and pricing</h4>
			<p class="text-xs text-ink/60">Existing size identities stay fixed for sales history.</p>
		</div>
		<button
			type="button"
			class={buttonStyles({ variant: 'outline', size: 'sm' })}
			onclick={addVariant}
			disabled={variants.length >= catalogSizes.length}
		>
			<Plus class="h-4 w-4" /> Add variant
		</button>
	</div>

	{#each variants as variant, index (variant.id ?? `${variant.size}-${index}`)}
		{@const fieldKey = `${idPrefix}-variant-${index}`}
		<div class={cx(cardStyles, 'bg-surface-muted')}>
			<div class={cx(cardBodyStyles, 'p-4')}>
				<div class="flex items-center justify-between gap-3">
					<div>
						<label for={`${fieldKey}-size`} class={fieldLabelStyles}>Size</label>
						<select
							id={`${fieldKey}-size`}
							class={selectStyles({ size: 'sm' })}
							value={variant.size}
							disabled={Boolean(variant.id)}
							onchange={(event) => updateSize(index, event.currentTarget.value)}
						>
							{#each catalogSizes as size (size)}
								<option
									value={size}
									disabled={variants.some(
										(candidate, candidateIndex) =>
											candidateIndex !== index && candidate.size === size
									)}
								>
									{size}
								</option>
							{/each}
						</select>
					</div>
					<button
						type="button"
						class={cx(buttonStyles({ variant: 'ghost', size: 'xs' }), 'text-danger')}
						onclick={() => removeVariant(index)}
						disabled={variants.length === 1}
						aria-label={`Remove size ${variant.size}`}
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for={`${fieldKey}-volume`} class={fieldLabelStyles}>Volume (ml)</label>
						<input
							id={`${fieldKey}-volume`}
							type="number"
							class={inputStyles({ size: 'sm', full: true })}
							bind:value={variant.volumeMl}
							min="1"
							step="1"
							required
						/>
					</div>
					<div>
						<label for={`${fieldKey}-cost`} class={fieldLabelStyles}>Cost price (IDR)</label>
						<input
							id={`${fieldKey}-cost`}
							type="number"
							class={inputStyles({ size: 'sm', full: true })}
							bind:value={variant.costPrice}
							min="0"
							step="100"
							required
						/>
					</div>
					<div>
						<label for={`${fieldKey}-price`} class={fieldLabelStyles}>Selling price (IDR)</label>
						<input
							id={`${fieldKey}-price`}
							type="number"
							class={inputStyles({ size: 'sm', full: true })}
							bind:value={variant.sellingPrice}
							min="0"
							step="100"
							required
						/>
					</div>
					{#if variant.sellingPrice > 0 && variant.costPrice > 0}
						<div class="self-end pb-2 text-xs text-ink/70">
							Margin {formatIdr(variant.sellingPrice - variant.costPrice)} ({Math.round(
								((variant.sellingPrice - variant.costPrice) / variant.costPrice) * 100
							)}%)
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>
