-- V8: Add verification document fields to farmers table
-- Farmers must upload verification documents (Aadhaar/Gov ID/Land ownership proof)
-- When a document is (re)uploaded, verification status resets to PENDING

-- Add verification document columns
ALTER TABLE user_schema.farmers ADD COLUMN IF NOT EXISTS verification_document TEXT;
ALTER TABLE user_schema.farmers ADD COLUMN IF NOT EXISTS document_uploaded_at TIMESTAMP;
ALTER TABLE user_schema.farmers ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN user_schema.farmers.verification_document IS 'Base64 encoded verification document (Aadhaar/Gov ID/Land proof) or URL';
COMMENT ON COLUMN user_schema.farmers.document_uploaded_at IS 'Timestamp when document was last uploaded';
COMMENT ON COLUMN user_schema.farmers.document_type IS 'Type of document uploaded: AADHAAR, GOV_ID, LAND_PROOF, OTHER';
