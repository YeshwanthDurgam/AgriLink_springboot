CREATE TABLE IF NOT EXISTS listing_price_update_proposals (
    id UUID PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    matched_commodity VARCHAR(120),
    current_price NUMERIC(12, 2) NOT NULL,
    suggested_price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    market_source VARCHAR(120),
    market_name VARCHAR(255),
    confidence_score INTEGER,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    responded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_update_listing_status ON listing_price_update_proposals(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_price_update_seller_status ON listing_price_update_proposals(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_price_update_created_at ON listing_price_update_proposals(created_at);
