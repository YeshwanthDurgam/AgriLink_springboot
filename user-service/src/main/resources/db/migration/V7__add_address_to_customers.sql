-- V7: Add address and pincode columns to customers table (missed in V5)

ALTER TABLE customers ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
