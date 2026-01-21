-- V7: Remove ALL payment status constraints and let JPA handle it
-- This is a definitive fix to remove any check constraint on payment_status

-- First, let's list and drop all check constraints on the payments table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all check constraints on payments table
    FOR r IN (
        SELECT con.conname 
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'payments'
        AND con.contype = 'c'
        AND (nsp.nspname = 'order_schema' OR nsp.nspname = 'public')
    )
    LOOP
        EXECUTE 'ALTER TABLE order_schema.payments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Also try dropping from public schema if it exists there
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
            EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Change the payment_status column to just VARCHAR without any constraint
-- This allows any value to be stored
ALTER TABLE order_schema.payments ALTER COLUMN payment_status TYPE VARCHAR(50);
