-- V6: Fix payment status constraint
-- Drop and recreate the constraint to allow all payment status values

-- First, drop any existing constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;

-- Now add the corrected constraint with all payment statuses
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check 
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
