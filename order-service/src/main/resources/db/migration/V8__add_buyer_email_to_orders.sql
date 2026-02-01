-- V8: Add buyer email and name columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);

-- Create index for buyer email
CREATE INDEX IF NOT EXISTS idx_order_buyer_email ON orders(buyer_email);
