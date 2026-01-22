-- V4: Add farmers, managers, and customers profile tables
-- These tables store role-specific profile information with verification status

-- Profile status enum values: PENDING, APPROVED, REJECTED

-- Create farmers table
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    age INTEGER,
    profile_photo VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    farm_name VARCHAR(200),
    crop_types TEXT,
    farm_photo VARCHAR(500),
    farm_bio TEXT,
    certificates TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create managers table
CREATE TABLE managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    age INTEGER,
    profile_photo VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    age INTEGER,
    profile_photo VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_farmers_status ON farmers(status);
CREATE INDEX idx_farmers_username ON farmers(username);

CREATE INDEX idx_managers_user_id ON managers(user_id);
CREATE INDEX idx_managers_status ON managers(status);
CREATE INDEX idx_managers_username ON managers(username);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_username ON customers(username);
