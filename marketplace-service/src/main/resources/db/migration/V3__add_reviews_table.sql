-- Create Reviews table if not exists (needed for fresh Neon databases)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhance Reviews table with additional fields
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Drop the old unique constraint if it exists (might not have order_id)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_listing_id_reviewer_id_key;

-- Add new indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Add average rating and review count to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Seller ratings summary table
CREATE TABLE IF NOT EXISTS seller_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL UNIQUE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    five_star_count INTEGER DEFAULT 0,
    four_star_count INTEGER DEFAULT 0,
    three_star_count INTEGER DEFAULT 0,
    two_star_count INTEGER DEFAULT 0,
    one_star_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller_id ON seller_ratings(seller_id);
