-- Order tracking table for detailed shipment tracking
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    carrier_status VARCHAR(100),
    estimated_delivery TIMESTAMP,
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_order_tracking_event_type ON order_tracking(event_type);
CREATE INDEX idx_order_tracking_created_at ON order_tracking(created_at DESC);
CREATE INDEX idx_order_tracking_tracking_number ON order_tracking(tracking_number);
