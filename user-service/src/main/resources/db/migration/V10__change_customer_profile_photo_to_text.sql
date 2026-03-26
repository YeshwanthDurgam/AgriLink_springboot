-- V10: Ensure customer profile photo column supports base64 payloads

DO $$
DECLARE
    customers_table regclass;
BEGIN
    -- Support both deployments:
    -- 1) user_schema.customers (schema-based setup)
    -- 2) customers in default/current schema
    customers_table := COALESCE(to_regclass('user_schema.customers'), to_regclass('customers'));

    IF customers_table IS NULL THEN
        RAISE EXCEPTION 'Cannot find customers table in user_schema or current schema';
    END IF;

    EXECUTE format('ALTER TABLE %s ALTER COLUMN profile_photo TYPE TEXT', customers_table);
    EXECUTE format($f$COMMENT ON COLUMN %s.profile_photo IS 'Profile photo payload (URL or base64 image data)'$f$, customers_table);
END $$;
