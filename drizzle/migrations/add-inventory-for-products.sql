-- Migration: Create inventory items for existing products
-- This creates an inventory item for each product that doesn't already have one

-- Insert inventory items for products that don't have matching inventory items
INSERT INTO inventory (id, name, unit, currentStock, minimumStock, createdAt, updatedAt)
SELECT 
    lower(hex(randomblob(16))), -- Generate unique ID
    p.title,
    'pcs', -- Products are counted in pieces
    0, -- Start with 0 stock
    10, -- Default minimum stock
    unixepoch('now'), -- Current timestamp
    unixepoch('now') -- Current timestamp
FROM product p
WHERE NOT EXISTS (
    SELECT 1 
    FROM inventory i 
    WHERE i.name = p.title
);