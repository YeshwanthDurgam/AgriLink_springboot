-- V5: Fix payment status constraint to include all required values

-- Drop the existing constraint if it exists
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;

-- Add the corrected constraint with all payment statuses
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
