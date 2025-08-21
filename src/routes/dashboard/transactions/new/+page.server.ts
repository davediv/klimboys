import { createDB } from '$lib/server/db';
import {
	product,
	category,
	transaction,
	transactionItem,
	customer,
	inventory,
	stockMovement,
	productRecipe
} from '$lib/server/db/schema';
import { requireAuth, filterDataByRole } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
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
		if (locals.session?.user?.role === 'cashier') {
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

		const db = createDB(platform.env.DB);

		// Try to create transaction with retry logic for unique constraint
		let transactionCreated = false;
		let transactionId = nanoid();
		let transactionNumber = '';
		let retryCount = 0;
		const maxRetries = 5;

		while (!transactionCreated && retryCount < maxRetries) {
			try {
				// Generate transaction number (format: YYYYMMDD-XXXX)
				const today = new Date();
				const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

				// Count today's transactions by checking transaction numbers that start with today's date
				const todayTransactions = await db.query.transaction.findMany({
					where: sql`${transaction.transactionNumber} LIKE ${dateStr + '-%'}`
				});

				// Find the highest number for today
				let nextNumber = 1;
				if (todayTransactions.length > 0) {
					const numbers = todayTransactions.map((t) => {
						const parts = t.transactionNumber.split('-');
						return parseInt(parts[1]) || 0;
					});
					nextNumber = Math.max(...numbers) + 1;
				}

				// Add retry count to avoid conflicts
				if (retryCount > 0) {
					nextNumber += retryCount;
				}

				transactionNumber = `${dateStr}-${String(nextNumber).padStart(4, '0')}`;

				// Create transaction
				await db.insert(transaction).values({
					id: transactionId,
					transactionNumber,
					cashierId: locals.session.user.id,
					customerId: result.data.customerId,
					channel: result.data.channel,
					paymentMethod: result.data.paymentMethod,
					totalAmount: result.data.totalAmount,
					totalCost: 0, // Will be calculated after items are created
					notes: result.data.notes,
					createdAt: new Date()
				});

				transactionCreated = true;
			} catch (error: any) {
				if (error?.message?.includes('UNIQUE constraint failed') && retryCount < maxRetries - 1) {
					console.warn(`Transaction number conflict, retrying... (attempt ${retryCount + 1})`);
					retryCount++;
					// Generate new transaction ID for retry
					transactionId = nanoid();
				} else {
					throw error;
				}
			}
		}

		if (!transactionCreated) {
			throw new Error('Failed to create transaction after multiple attempts');
		}

		try {
			// Create transaction items and calculate total cost
			let totalCost = 0;

			for (const item of result.data.items) {
				// Get product cost for the item
				const prod = await db.query.product.findFirst({
					where: eq(product.id, item.productId)
				});

				const unitCost = prod?.productCost || 0;
				const itemCost = unitCost * item.quantity;
				totalCost += itemCost;

				await db.insert(transactionItem).values({
					id: nanoid(),
					transactionId,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.price,
					unitCost,
					subtotal: item.subtotal,
					createdAt: new Date()
				});
			}

			// Update transaction with calculated total cost
			await db.update(transaction).set({ totalCost }).where(eq(transaction.id, transactionId));

			// Update inventory based on product recipes
			for (const item of result.data.items) {
				// Get product recipes
				const recipes = await db.query.productRecipe.findMany({
					where: eq(productRecipe.productId, item.productId),
					with: {
						inventory: true
					}
				});

				// Deduct inventory for each recipe item
				for (const recipe of recipes) {
					const totalQuantityNeeded = recipe.quantity * item.quantity;

					// Update inventory stock
					const currentInventory = await db.query.inventory.findFirst({
						where: eq(inventory.id, recipe.inventoryId)
					});

					if (currentInventory) {
						const newStock = currentInventory.currentStock - totalQuantityNeeded;

						// Update inventory
						await db
							.update(inventory)
							.set({
								currentStock: Math.max(0, newStock), // Prevent negative stock
								updatedAt: new Date()
							})
							.where(eq(inventory.id, recipe.inventoryId));

						// Create stock movement record
						await db.insert(stockMovement).values({
							id: nanoid(),
							inventoryId: recipe.inventoryId,
							type: 'out',
							quantity: totalQuantityNeeded,
							reason: `Transaction #${transactionNumber}`,
							transactionId,
							createdBy: locals.session.user.id,
							createdAt: new Date()
						});
					}
				}
			}

			console.log('Transaction created successfully:', {
				transactionId,
				transactionNumber,
				totalAmount: result.data.totalAmount,
				totalCost,
				itemCount: result.data.items.length
			});

			return redirect(303, '/dashboard/transactions');
		} catch (error: any) {
			// Check if this is a SvelteKit redirect (not an actual error)
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				// This is a redirect, not an error - re-throw it
				throw error;
			}

			console.error('Create transaction error:', error);
			// If we already created the transaction but failed on items, we should clean up
			if (transactionCreated) {
				try {
					await db.delete(transaction).where(eq(transaction.id, transactionId));
					console.log('Cleaned up failed transaction:', transactionId);
				} catch (cleanupError) {
					console.error('Failed to cleanup transaction:', cleanupError);
				}
			}
			return fail(500, {
				message: 'Failed to create transaction'
			});
		}
	}
} satisfies Actions;
