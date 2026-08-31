import type { PublicCatalogProduct, PublicCatalogResult } from '$lib/catalog';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { and, asc, eq, like, or } from 'drizzle-orm';

interface PublicCatalogOptions {
	category?: string;
	limit?: number;
	search?: string;
}

export async function getPublicCatalog({
	category = '',
	limit = 100,
	search = ''
}: PublicCatalogOptions = {}): Promise<PublicCatalogResult> {
	const db = getDb();
	const normalizedSearch = search.trim();
	const conditions = [eq(products.isActive, true)];

	if (category) conditions.push(eq(products.category, category));
	if (normalizedSearch) {
		conditions.push(
			or(
				like(products.name, `%${normalizedSearch}%`),
				like(products.description, `%${normalizedSearch}%`)
			)!
		);
	}

	const selectedProducts = db
		.select({
			id: products.id,
			name: products.name,
			description: products.description,
			category: products.category,
			imageUrl: products.imageUrl
		})
		.from(products)
		.where(and(...conditions))
		.orderBy(asc(products.name))
		.limit(Math.min(Math.max(limit, 1), 100))
		.as('selected_products');

	const [catalogRows, categoryRows] = await Promise.all([
		db
			.select({
				id: selectedProducts.id,
				name: selectedProducts.name,
				description: selectedProducts.description,
				category: selectedProducts.category,
				imageUrl: selectedProducts.imageUrl,
				variantId: productVariants.id,
				variantSize: productVariants.size,
				variantVolumeMl: productVariants.volumeMl,
				variantSellingPrice: productVariants.sellingPrice,
				variantStockQuantity: productVariants.stockQuantity
			})
			.from(selectedProducts)
			.leftJoin(
				productVariants,
				and(eq(productVariants.productId, selectedProducts.id), eq(productVariants.isActive, true))
			)
			.orderBy(asc(selectedProducts.name), asc(productVariants.volumeMl)),
		db
			.selectDistinct({ category: products.category })
			.from(products)
			.where(eq(products.isActive, true))
			.orderBy(asc(products.category))
	]);

	const catalogById = new Map<string, PublicCatalogProduct>();
	for (const row of catalogRows) {
		let product = catalogById.get(row.id);
		if (!product) {
			product = {
				id: row.id,
				name: row.name,
				description: row.description,
				category: row.category,
				imageUrl: row.imageUrl,
				variants: []
			};
			catalogById.set(row.id, product);
		}

		if (
			row.variantId !== null &&
			row.variantSize !== null &&
			row.variantVolumeMl !== null &&
			row.variantSellingPrice !== null &&
			row.variantStockQuantity !== null
		) {
			product.variants.push({
				id: row.variantId,
				size: row.variantSize,
				volumeMl: row.variantVolumeMl,
				sellingPrice: row.variantSellingPrice,
				available: row.variantStockQuantity > 0
			});
		}
	}

	return {
		products: Array.from(catalogById.values()),
		categories: categoryRows.map(({ category: value }) => value)
	};
}
