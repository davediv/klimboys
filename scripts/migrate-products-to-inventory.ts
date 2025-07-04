#!/usr/bin/env node
// Script to create inventory items for existing products

import { createDB } from '../src/lib/server/db/index.js';
import { product, inventory } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function migrateProductsToInventory() {
	console.log('Starting migration: Creating inventory items for existing products...');

	try {
		// Note: This script should be run with proper database connection
		// For local development: Use wrangler D1 execute or similar
		// For production: Run through appropriate deployment pipeline
		
		const db = createDB(/* your D1 database instance */);

		// Get all products
		const products = await db.query.product.findMany();
		console.log(`Found ${products.length} products to process`);

		let created = 0;
		let skipped = 0;

		for (const prod of products) {
			// Check if inventory item already exists for this product
			const existingInventory = await db.query.inventory.findFirst({
				where: eq(inventory.name, prod.title)
			});

			if (existingInventory) {
				console.log(`Skipping "${prod.title}" - inventory item already exists`);
				skipped++;
				continue;
			}

			// Create inventory item
			const inventoryId = nanoid();
			await db.insert(inventory).values({
				id: inventoryId,
				name: prod.title,
				unit: 'pcs', // Products are counted in pieces
				currentStock: 0, // Start with 0 stock
				minimumStock: 10, // Default minimum stock
				createdAt: new Date(),
				updatedAt: new Date()
			});

			console.log(`Created inventory item for product: ${prod.title}`);
			created++;
		}

		console.log('\nMigration completed!');
		console.log(`- Created: ${created} inventory items`);
		console.log(`- Skipped: ${skipped} (already existed)`);
		console.log(`- Total products: ${products.length}`);

	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	migrateProductsToInventory();
}