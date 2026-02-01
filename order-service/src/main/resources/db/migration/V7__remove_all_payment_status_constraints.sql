-- V7: Remove ALL payment status constraints and let JPA handle it
-- This is a definitive fix to remove any check constraint on payment_status

-- Drop all check constraints on the payments table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT con.conname 
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'payments'
        AND con.contype = 'c'
        AND nsp.nspname = 'public'
    )
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Change the payment_status column to just VARCHAR without any constraint
ALTER TABLE payments ALTER COLUMN payment_status TYPE VARCHAR(50);
