import { createDB } from '$lib/server/db';
import { product, category, transaction, transactionItem, customer } from '$lib/server/db/schema';
import { requireAuth, filterDataByRole } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const transactionSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.string(),
				quantity: z.number().min(1),
				price: z.number().min(0),
				subtotal: z.number().min(0)
			})
		)
		.min(1, 'At least one item is required'),
	channel: z.enum(['store', 'grabfood', 'gofood', 'shopeefood', 'ubereats']),
	paymentMethod: z.enum([
		'cash',
		'qris',
		'debit_card',
		'credit_card',
		'grabfood',
		'gofood',
		'shopeefood',
		'ubereats'
	]),
	customerId: z.string().optional(),
	totalAmount: z.number().min(0),
	notes: z.string().optional()
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAuth(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get all available products with categories
	const products = await db.query.product.findMany({
		where: eq(product.isAvailable, true),
		with: {
			category: true
		}
	});

	// Filter sensitive data for cashiers
	const filteredProducts = products.map((p) => {
		if (locals.session.user.role === 'cashier') {
			return filterDataByRole(p, locals.session.user.role, ['productCost']);
		}
		return p;
	});

	// Get categories for filtering
	const categories = await db.query.category.findMany();

	// Get customers for selection
	const customers = await db.query.customer.findMany({
		orderBy: (customers, { asc }) => [asc(customers.name)]
	});

	return {
		products: filteredProducts,
		categories,
		customers
	};
};

export const actions = {
	create: async ({ request, locals, platform }) => {
		requireAuth(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();

		// Parse items from form data
		const items = [];
		let i = 0;
		while (formData.has(`items[${i}][productId]`)) {
			items.push({
				productId: formData.get(`items[${i}][productId]`) as string,
				quantity: parseInt(formData.get(`items[${i}][quantity]`) as string),
				price: parseFloat(formData.get(`items[${i}][price]`) as string),
				subtotal: parseFloat(formData.get(`items[${i}][subtotal]`) as string)
			});
			i++;
		}

		const data = {
			items,
			channel: formData.get('channel') as string,
			paymentMethod: formData.get('paymentMethod') as string,
			customerId: (formData.get('customerId') as string) || undefined,
			totalAmount: parseFloat(formData.get('totalAmount') as string),
			notes: (formData.get('notes') as string) || undefined
		};

		const result = transactionSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				message: 'Invalid transaction data'
			});
		}

		try {
			const db = createDB(platform.env.DB);
			const transactionId = nanoid();

			// Generate transaction number (format: YYYYMMDD-XXXX)
			const today = new Date();
			const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

			// Count today's transactions
			const startOfDay = new Date(today);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(today);
			endOfDay.setHours(23, 59, 59, 999);

			const todayCount = await db.query.transaction.findMany({
				where: and(eq(transaction.createdAt, startOfDay), eq(transaction.createdAt, endOfDay))
			});

			const transactionNumber = `${dateStr}-${String(todayCount.length + 1).padStart(4, '0')}`;

			// Create transaction
			await db.insert(transaction).values({
				id: transactionId,
				transactionNumber,
				cashierId: locals.session.user.id,
				customerId: result.data.customerId,
				channel: result.data.channel,
				paymentMethod: result.data.paymentMethod,
				totalAmount: result.data.totalAmount,
				totalCost: 0, // TODO: Calculate from product costs
				notes: result.data.notes,
				createdAt: new Date()
			});

			// Create transaction items
			for (const item of result.data.items) {
				// Get product cost for the item
				const prod = await db.query.product.findFirst({
					where: eq(product.id, item.productId)
				});
				
				await db.insert(transactionItem).values({
					id: nanoid(),
					transactionId,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.price,
					unitCost: prod?.productCost || 0,
					subtotal: item.subtotal,
					createdAt: new Date()
				});
			}

			// TODO: Update inventory based on product recipes

			return redirect(303, '/dashboard/transactions');
		} catch (error) {
			console.error('Create transaction error:', error);
			return fail(500, {
				message: 'Failed to create transaction'
			});
		}
	}
} satisfies Actions;
