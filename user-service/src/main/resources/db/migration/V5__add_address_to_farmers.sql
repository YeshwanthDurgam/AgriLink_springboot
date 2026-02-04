-- V5: Add address and pincode columns to farmers table

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
