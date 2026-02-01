-- Add image_url column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
