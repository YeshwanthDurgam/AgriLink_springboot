-- V4: Add Razorpay payment integration fields

-- Add Razorpay specific columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_receipt VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(500);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(14, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Create indexes for Razorpay lookups
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

-- Update payment_status enum to include new statuses
-- Note: PostgreSQL enum modification - we add new values
DO $$
BEGIN
    -- Check if the payment_status column exists and add constraint for new values
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'payments' AND column_name = 'payment_status') THEN
        -- Update existing constraint to allow new values
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
        ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check 
            CHECK (payment_status IN ('PENDING', 'CREATED', 'AUTHORIZED', 'CAPTURED', 
                                       'COMPLETED', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 
                                       'CANCELLED', 'PROCESSING'));
    END IF;
END $$;

-- Update default currency to INR
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';
ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'INR';

-- Add index for order lookups
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
