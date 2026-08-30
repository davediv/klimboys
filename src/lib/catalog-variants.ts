export interface CatalogVariantInput {
	id?: string;
	size: string;
	volumeMl: number;
	costPrice: number;
	sellingPrice: number;
}

export interface ExistingCatalogVariant {
	id: string;
	size: string;
	isActive: boolean;
}

export interface PlannedCatalogVariant extends CatalogVariantInput {
	id: string;
	operation: 'insert' | 'update';
}

export interface VariantReconciliationPlan {
	variants: PlannedCatalogVariant[];
	retireIds: string[];
}

export class VariantIdentityError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'VariantIdentityError';
	}
}

export function reconcileVariantIdentities(
	existingVariants: readonly ExistingCatalogVariant[],
	incomingVariants: readonly CatalogVariantInput[],
	createId: () => string = () => crypto.randomUUID()
): VariantReconciliationPlan {
	const existingById = new Map(existingVariants.map((variant) => [variant.id, variant]));
	const existingBySize = new Map(existingVariants.map((variant) => [variant.size, variant]));
	const claimedIds = new Set<string>();
	const seenSizes = new Set<string>();
	const variants: PlannedCatalogVariant[] = [];

	for (const incoming of incomingVariants) {
		if (seenSizes.has(incoming.size)) {
			throw new VariantIdentityError('Variant sizes must be unique.');
		}
		seenSizes.add(incoming.size);

		const existing = incoming.id
			? existingById.get(incoming.id)
			: existingBySize.get(incoming.size);
		if (incoming.id && !existing) {
			throw new VariantIdentityError('A variant does not belong to this product.');
		}
		if (existing && existing.size !== incoming.size) {
			throw new VariantIdentityError(
				'An existing variant size cannot be changed; add a new size instead.'
			);
		}

		const id = existing?.id ?? createId();
		if (claimedIds.has(id)) {
			throw new VariantIdentityError('A variant can only appear once.');
		}
		claimedIds.add(id);
		variants.push({
			...incoming,
			id,
			operation: existing ? 'update' : 'insert'
		});
	}

	return {
		variants,
		retireIds: existingVariants
			.filter((variant) => variant.isActive && !claimedIds.has(variant.id))
			.map((variant) => variant.id)
	};
}
