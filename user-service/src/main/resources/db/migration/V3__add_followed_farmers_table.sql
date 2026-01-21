-- V3: Add followed_farmers table for customer-farmer follow relationships

-- Create followed_farmers table
CREATE TABLE followed_farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    farmer_id UUID NOT NULL,
    followed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_farmer UNIQUE (user_id, farmer_id)
);

-- Create indexes for performance
CREATE INDEX idx_followed_farmers_user_id ON followed_farmers(user_id);
CREATE INDEX idx_followed_farmers_farmer_id ON followed_farmers(farmer_id);
