-- V8: Add verification document fields to farmers table
-- Farmers must upload verification documents (Aadhaar/Gov ID/Land ownership proof)
-- When a document is (re)uploaded, verification status resets to PENDING

DO $$
DECLARE
	farmers_table regclass;
BEGIN
	-- Support both deployments:
	-- 1) Neon/profiled setup where tables are in user_schema
	-- 2) Local/default setup where tables are in public/current schema
	farmers_table := COALESCE(to_regclass('user_schema.farmers'), to_regclass('farmers'));

	IF farmers_table IS NULL THEN
		RAISE EXCEPTION 'Cannot find farmers table in user_schema or current schema';
	END IF;

	-- Add verification document columns
	EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS verification_document TEXT', farmers_table);
	EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS document_uploaded_at TIMESTAMP', farmers_table);
	EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS document_type VARCHAR(50)', farmers_table);

	-- Add comment for documentation
	EXECUTE format($f$COMMENT ON COLUMN %s.verification_document IS 'Base64 encoded verification document (Aadhaar/Gov ID/Land proof) or URL'$f$, farmers_table);
	EXECUTE format($f$COMMENT ON COLUMN %s.document_uploaded_at IS 'Timestamp when document was last uploaded'$f$, farmers_table);
	EXECUTE format($f$COMMENT ON COLUMN %s.document_type IS 'Type of document uploaded: AADHAAR, GOV_ID, LAND_PROOF, OTHER'$f$, farmers_table);
END $$;
