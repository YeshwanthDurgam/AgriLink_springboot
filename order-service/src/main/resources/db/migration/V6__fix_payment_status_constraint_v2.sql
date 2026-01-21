-- V6: Fix payment status constraint (with explicit schema)
-- Drop and recreate the constraint to allow all payment status values

-- First, drop any existing constraint
ALTER TABLE order_schema.payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;

-- Also try without schema prefix in case it was created that way
DO $$
BEGIN
    -- Try to drop constraint without schema prefix
    EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check';
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
    NULL;
END $$;

-- Now add the corrected constraint with all payment statuses
ALTER TABLE order_schema.payments ADD CONSTRAINT payments_payment_status_check 
    CHECK (payment_status IN (
        'PENDING',
        'PROCESSING', 
        'CREATED', 
        'AUTHORIZED', 
        'CAPTURED', 
        'COMPLETED', 
        'FAILED', 
        'REFUND_PENDING', 
        'REFUNDED', 
        'CANCELLED'
    ));
