-- Improve text search performance for marketplace listings.
-- Requires PostgreSQL pg_trgm extension for trigram index operators.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
    ON listings USING gin (LOWER(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_description_trgm
    ON listings USING gin (LOWER(COALESCE(description, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_crop_type_trgm
    ON listings USING gin (LOWER(COALESCE(crop_type, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_status_created_at
    ON listings(status, created_at DESC);
