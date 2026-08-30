import type { PublicCatalogResult } from '$lib/catalog';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { and, asc, eq, inArray, like, or } from 'drizzle-orm';

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

	const [productRows, categoryRows] = await Promise.all([
		db
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
			.limit(Math.min(Math.max(limit, 1), 100)),
		db
			.selectDistinct({ category: products.category })
			.from(products)
			.where(eq(products.isActive, true))
			.orderBy(asc(products.category))
	]);

	const productIds = productRows.map((product) => product.id);
	const variantRows =
		productIds.length === 0
			? []
			: await db
					.select({
						id: productVariants.id,
						productId: productVariants.productId,
						size: productVariants.size,
						volumeMl: productVariants.volumeMl,
						sellingPrice: productVariants.sellingPrice,
						stockQuantity: productVariants.stockQuantity
					})
					.from(productVariants)
					.where(inArray(productVariants.productId, productIds))
					.orderBy(asc(productVariants.volumeMl));

	return {
		products: productRows.map((product) => ({
			...product,
			variants: variantRows
				.filter((variant) => variant.productId === product.id)
				.map((variant) => ({
					id: variant.id,
					size: variant.size,
					volumeMl: variant.volumeMl,
					sellingPrice: variant.sellingPrice,
					available: variant.stockQuantity > 0
				}))
		})),
		categories: categoryRows.map(({ category: value }) => value)
	};
}
