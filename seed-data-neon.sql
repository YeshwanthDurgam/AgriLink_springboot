-- =====================================================
-- AgriLink Seed Data Script for Neon Database
-- =====================================================
-- Creates: 2 Farmers, 1 Customer, Categories, 40 Products
-- Uses SCHEMAS instead of separate databases
-- =====================================================

-- Enable UUID extension in PUBLIC schema (Neon uses public schema for extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- =====================================================
-- CREATE SCHEMAS FOR EACH SERVICE
-- =====================================================
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS farm_schema;
CREATE SCHEMA IF NOT EXISTS marketplace_schema;
CREATE SCHEMA IF NOT EXISTS order_schema;
CREATE SCHEMA IF NOT EXISTS iot_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;

-- =====================================================
-- AUTH SCHEMA (auth_schema)
-- =====================================================

-- Create Roles table if not exists
CREATE TABLE IF NOT EXISTS auth_schema.roles (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Users table if not exists
CREATE TABLE IF NOT EXISTS auth_schema.users (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    account_non_expired BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    credentials_non_expired BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create User Roles junction table if not exists
CREATE TABLE IF NOT EXISTS auth_schema.user_roles (
    user_id UUID REFERENCES auth_schema.users(id),
    role_id UUID REFERENCES auth_schema.roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Create Roles
INSERT INTO auth_schema.roles (id, name, description, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'FARMER', 'Farm owner who can list and sell products', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'BUYER', 'Customer who can purchase products', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'ADMIN', 'System administrator with full access', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create Users (Password: Password@123 - BCrypt encoded)
INSERT INTO auth_schema.users (id, email, phone, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, created_at, updated_at) VALUES
('aaaa1111-aaaa-1111-aaaa-111111111111', 'rajesh.kumar@agrilink.com', '+919876543210', '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.', true, true, true, true, NOW(), NOW()),
('aaaa2222-aaaa-2222-aaaa-222222222222', 'priya.sharma@agrilink.com', '+919876543211', '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.', true, true, true, true, NOW(), NOW()),
('bbbb1111-bbbb-1111-bbbb-111111111111', 'amit.patel@agrilink.com', '+919876543212', '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ij.w9./FfC2HHCS8eY0qRgSYK.qZz.', true, true, true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Assign Roles to Users
INSERT INTO auth_schema.user_roles (user_id, role_id) VALUES
('aaaa1111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111'),
('aaaa2222-aaaa-2222-aaaa-222222222222', '11111111-1111-1111-1111-111111111111'),
('bbbb1111-bbbb-1111-bbbb-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- =====================================================
-- USER SCHEMA (user_schema)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_schema.user_profiles (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    profile_picture_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO user_schema.user_profiles (id, user_id, first_name, last_name, date_of_birth, address, city, state, country, postal_code, profile_picture_url, bio, created_at, updated_at) VALUES
('cccc1111-cccc-1111-cccc-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'Rajesh', 'Kumar', '1985-05-15', '123 Farm Road, Village Sundarpur', 'Lucknow', 'Uttar Pradesh', 'India', '226001', 'https://randomuser.me/api/portraits/men/32.jpg', 'Third-generation farmer specializing in organic vegetables and grains.', NOW(), NOW()),
('cccc2222-cccc-2222-cccc-222222222222', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'Priya', 'Sharma', '1990-08-22', '456 Green Valley, Village Haritpur', 'Pune', 'Maharashtra', 'India', '411001', 'https://randomuser.me/api/portraits/women/44.jpg', 'Passionate about organic farming and connecting farmers directly with consumers.', NOW(), NOW()),
('cccc3333-cccc-3333-cccc-333333333333', 'bbbb1111-bbbb-1111-bbbb-111111111111', 'Amit', 'Patel', '1988-12-10', '789 Business Park, Sector 5', 'Mumbai', 'Maharashtra', 'India', '400001', 'https://randomuser.me/api/portraits/men/67.jpg', 'Restaurant owner looking for fresh, organic produce directly from farmers.', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- FARM SCHEMA (farm_schema)
-- =====================================================

CREATE TABLE IF NOT EXISTS farm_schema.farms (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    farmer_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    total_area DECIMAL(10,2),
    area_unit VARCHAR(20),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO farm_schema.farms (id, farmer_id, name, description, location, total_area, area_unit, latitude, longitude, active, created_at, updated_at) VALUES
('dddd1111-dddd-1111-dddd-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'Kumar Organic Farm', 'A 50-acre organic farm specializing in vegetables, grains, and pulses.', 'Sundarpur Village, Lucknow District, Uttar Pradesh', 50.00, 'HECTARE', 26.8467, 80.9462, true, NOW(), NOW()),
('dddd2222-dddd-2222-dddd-222222222222', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'Sharma Fruits & Spices', 'Premium fruit orchard and spice garden spread across 35 acres.', 'Haritpur Village, Pune District, Maharashtra', 35.00, 'HECTARE', 18.5204, 73.8567, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MARKETPLACE SCHEMA (marketplace_schema)
-- =====================================================

CREATE TABLE IF NOT EXISTS marketplace_schema.categories (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES marketplace_schema.categories(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_schema.listings (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    seller_id UUID NOT NULL,
    farm_id UUID,
    category_id UUID REFERENCES marketplace_schema.categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    crop_type VARCHAR(100),
    quantity DECIMAL(10,2),
    quantity_unit VARCHAR(20),
    price_per_unit DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    minimum_order DECIMAL(10,2),
    harvest_date DATE,
    expiry_date DATE,
    location VARCHAR(255),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    organic_certified BOOLEAN DEFAULT FALSE,
    quality_grade VARCHAR(10),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    view_count INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_schema.listing_images (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_schema.listings(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories
INSERT INTO marketplace_schema.categories (id, name, description, parent_id, active, created_at, updated_at) VALUES
('eeee0001-eeee-0001-eeee-000000000001', 'Vegetables', 'Fresh vegetables directly from farms', NULL, true, NOW(), NOW()),
('eeee0002-eeee-0002-eeee-000000000002', 'Fruits', 'Fresh and seasonal fruits', NULL, true, NOW(), NOW()),
('eeee0003-eeee-0003-eeee-000000000003', 'Grains & Cereals', 'Rice, wheat, millets and other grains', NULL, true, NOW(), NOW()),
('eeee0004-eeee-0004-eeee-000000000004', 'Pulses & Legumes', 'Lentils, beans, and other pulses', NULL, true, NOW(), NOW()),
('eeee0005-eeee-0005-eeee-000000000005', 'Spices', 'Fresh and dried spices', NULL, true, NOW(), NOW()),
('eeee0006-eeee-0006-eeee-000000000006', 'Dairy Products', 'Milk, cheese, butter and more', NULL, true, NOW(), NOW()),
('eeee0007-eeee-0007-eeee-000000000007', 'Organic Products', 'Certified organic produce', NULL, true, NOW(), NOW()),
('eeee0008-eeee-0008-eeee-000000000008', 'Seeds & Saplings', 'Seeds and plant saplings for farming', NULL, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- LISTINGS (40 Products)
-- =====================================================

INSERT INTO marketplace_schema.listings (id, seller_id, farm_id, category_id, title, description, crop_type, quantity, quantity_unit, price_per_unit, currency, minimum_order, harvest_date, expiry_date, location, latitude, longitude, organic_certified, quality_grade, status, view_count, average_rating, review_count, created_at, updated_at) VALUES
('ffff0001-ffff-0001-ffff-000000000001', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Fresh Organic Tomatoes', 'Ripe, juicy organic tomatoes grown without pesticides. Perfect for salads and cooking.', 'Tomato', 500.00, 'KG', 45.00, 'INR', 5.00, '2026-01-15', '2026-01-30', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 125, 4.50, 12, NOW(), NOW()),
('ffff0002-ffff-0002-ffff-000000000002', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Green Capsicum (Bell Pepper)', 'Crisp and fresh green bell peppers. Rich in vitamins.', 'Capsicum', 200.00, 'KG', 80.00, 'INR', 2.00, '2026-01-14', '2026-01-28', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 89, 4.30, 8, NOW(), NOW()),
('ffff0003-ffff-0003-ffff-000000000003', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Fresh Spinach (Palak)', 'Tender organic spinach leaves, freshly harvested. Excellent source of iron.', 'Spinach', 150.00, 'KG', 35.00, 'INR', 1.00, '2026-01-18', '2026-01-25', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 156, 4.70, 15, NOW(), NOW()),
('ffff0004-ffff-0004-ffff-000000000004', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Organic Potatoes', 'Farm-fresh potatoes, perfect for curries, fries, and baking.', 'Potato', 1000.00, 'KG', 25.00, 'INR', 10.00, '2026-01-10', '2026-02-28', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 234, 4.40, 22, NOW(), NOW()),
('ffff0005-ffff-0005-ffff-000000000005', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Fresh Onions', 'Quality red onions with strong flavor. Essential for every kitchen.', 'Onion', 800.00, 'KG', 30.00, 'INR', 5.00, '2026-01-12', '2026-03-15', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, false, 'A', 'ACTIVE', 312, 4.20, 28, NOW(), NOW()),
('ffff0006-ffff-0006-ffff-000000000006', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Organic Carrots', 'Sweet and crunchy organic carrots. Great for salads, juices, and cooking.', 'Carrot', 300.00, 'KG', 40.00, 'INR', 2.00, '2026-01-16', '2026-02-10', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 178, 4.60, 14, NOW(), NOW()),
('ffff0007-ffff-0007-ffff-000000000007', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Fresh Cauliflower', 'White, compact cauliflower heads. Perfect for gobi dishes.', 'Cauliflower', 250.00, 'KG', 35.00, 'INR', 2.00, '2026-01-17', '2026-01-31', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 145, 4.35, 11, NOW(), NOW()),
('ffff0008-ffff-0008-ffff-000000000008', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0001-eeee-0001-eeee-000000000001', 'Green Peas (Matar)', 'Sweet and tender green peas, freshly shelled.', 'Peas', 180.00, 'KG', 90.00, 'INR', 1.00, '2026-01-15', '2026-01-28', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 201, 4.75, 18, NOW(), NOW()),
('ffff0016-ffff-0016-ffff-000000000016', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0003-eeee-0003-eeee-000000000003', 'Premium Basmati Rice', 'Long-grain aromatic basmati rice. Aged for 2 years for best flavor.', 'Rice', 2000.00, 'KG', 120.00, 'INR', 25.00, '2025-11-15', '2026-11-15', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, false, 'A+', 'ACTIVE', 456, 4.80, 42, NOW(), NOW()),
('ffff0017-ffff-0017-ffff-000000000017', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0003-eeee-0003-eeee-000000000003', 'Organic Wheat Flour (Atta)', 'Stone-ground whole wheat flour from organic wheat.', 'Wheat', 1500.00, 'KG', 45.00, 'INR', 10.00, '2025-12-01', '2026-06-01', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 389, 4.55, 35, NOW(), NOW()),
('ffff0018-ffff-0018-ffff-000000000018', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0003-eeee-0003-eeee-000000000003', 'Pearl Millet (Bajra)', 'Nutritious bajra grains. Excellent for rotis and porridge.', 'Millet', 500.00, 'KG', 55.00, 'INR', 5.00, '2025-11-20', '2026-05-20', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 167, 4.30, 13, NOW(), NOW()),
('ffff0028-ffff-0028-ffff-000000000028', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0004-eeee-0004-eeee-000000000004', 'Toor Dal (Arhar)', 'Premium quality toor dal. Essential for sambar and dal fry.', 'Toor Dal', 500.00, 'KG', 140.00, 'INR', 5.00, '2025-11-01', '2026-05-01', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, false, 'A', 'ACTIVE', 345, 4.55, 32, NOW(), NOW()),
('ffff0029-ffff-0029-ffff-000000000029', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0004-eeee-0004-eeee-000000000004', 'Moong Dal (Yellow)', 'Easy to digest yellow moong dal. Perfect for khichdi and dal.', 'Moong Dal', 400.00, 'KG', 130.00, 'INR', 5.00, '2025-11-05', '2026-05-05', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A', 'ACTIVE', 289, 4.60, 26, NOW(), NOW()),
('ffff0041-ffff-0041-ffff-000000000041', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0007-eeee-0007-eeee-000000000007', 'Organic Jaggery (Gur)', 'Traditional unrefined jaggery. Natural sweetener with minerals.', 'Jaggery', 200.00, 'KG', 80.00, 'INR', 1.00, '2025-12-15', '2026-12-15', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 189, 4.70, 16, NOW(), NOW()),
('ffff0042-ffff-0042-ffff-000000000042', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0007-eeee-0007-eeee-000000000007', 'Cold Pressed Mustard Oil', 'Pure cold-pressed mustard oil. Traditional extraction method.', 'Mustard Oil', 100.00, 'LITRE', 220.00, 'INR', 1.00, '2025-12-20', '2026-06-20', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 345, 4.80, 31, NOW(), NOW()),
('ffff0043-ffff-0043-ffff-000000000043', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0007-eeee-0007-eeee-000000000007', 'Organic Honey', 'Raw, unprocessed honey from forest flowers. Rich in antioxidants.', 'Honey', 50.00, 'KG', 450.00, 'INR', 0.50, '2025-11-01', '2027-11-01', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 412, 4.90, 38, NOW(), NOW()),
('ffff0044-ffff-0044-ffff-000000000044', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0007-eeee-0007-eeee-000000000007', 'Organic Turmeric Powder', 'High curcumin organic turmeric. Ground fresh from our farm.', 'Turmeric', 80.00, 'KG', 280.00, 'INR', 0.25, '2025-12-10', '2026-12-10', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 289, 4.75, 26, NOW(), NOW()),
('ffff0045-ffff-0045-ffff-000000000045', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'eeee0007-eeee-0007-eeee-000000000007', 'Organic Ghee (Desi)', 'Pure A2 cow ghee made using traditional bilona method.', 'Ghee', 30.00, 'KG', 1500.00, 'INR', 0.50, '2026-01-01', '2026-07-01', 'Lucknow, Uttar Pradesh', 26.8467, 80.9462, true, 'A+', 'ACTIVE', 523, 4.95, 48, NOW(), NOW()),
('ffff0051-ffff-0051-ffff-000000000051', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Alphonso Mangoes', 'Premium Ratnagiri Alphonso mangoes. King of fruits with rich aroma.', 'Mango', 500.00, 'KG', 600.00, 'INR', 5.00, '2026-04-15', '2026-06-30', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 678, 4.90, 62, NOW(), NOW()),
('ffff0052-ffff-0052-ffff-000000000052', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Kesar Mangoes', 'Sweet and aromatic Kesar mangoes from Gujarat.', 'Mango', 400.00, 'KG', 450.00, 'INR', 5.00, '2026-04-20', '2026-07-15', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 534, 4.80, 48, NOW(), NOW()),
('ffff0053-ffff-0053-ffff-000000000053', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Fresh Pomegranate', 'Ruby red pomegranates. Sweet and juicy with high antioxidants.', 'Pomegranate', 300.00, 'KG', 180.00, 'INR', 2.00, '2026-01-10', '2026-02-28', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 423, 4.75, 38, NOW(), NOW()),
('ffff0054-ffff-0054-ffff-000000000054', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Organic Bananas', 'Fresh organic bananas. Naturally ripened, chemical-free.', 'Banana', 800.00, 'KG', 45.00, 'INR', 5.00, '2026-01-15', '2026-01-30', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 356, 4.60, 32, NOW(), NOW()),
('ffff0055-ffff-0055-ffff-000000000055', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Fresh Grapes (Thompson)', 'Sweet seedless Thompson grapes. Perfect for eating and juice.', 'Grapes', 400.00, 'KG', 120.00, 'INR', 2.00, '2026-01-12', '2026-02-15', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 289, 4.55, 26, NOW(), NOW()),
('ffff0056-ffff-0056-ffff-000000000056', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Fresh Strawberries', 'Sweet organic strawberries. Freshly picked from our farm.', 'Strawberry', 100.00, 'KG', 350.00, 'INR', 0.50, '2026-01-18', '2026-01-28', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 445, 4.85, 40, NOW(), NOW()),
('ffff0057-ffff-0057-ffff-000000000057', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Dragon Fruit', 'Exotic pink dragon fruit. Mildly sweet with unique texture.', 'Dragon Fruit', 80.00, 'KG', 280.00, 'INR', 0.50, '2026-01-19', '2026-02-05', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 312, 4.65, 28, NOW(), NOW()),
('ffff0058-ffff-0058-ffff-000000000058', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0002-eeee-0002-eeee-000000000002', 'Fresh Avocado', 'Creamy Hass avocados. Perfect for guacamole and salads.', 'Avocado', 50.00, 'KG', 400.00, 'INR', 0.50, '2026-01-17', '2026-02-01', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 289, 4.75, 26, NOW(), NOW()),
('ffff0071-ffff-0071-ffff-000000000071', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0005-eeee-0005-eeee-000000000005', 'Red Chilli Powder', 'Premium red chilli powder. Perfect heat and color for curries.', 'Red Chilli', 100.00, 'KG', 350.00, 'INR', 0.25, '2025-12-01', '2026-12-01', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 456, 4.65, 42, NOW(), NOW()),
('ffff0072-ffff-0072-ffff-000000000072', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0005-eeee-0005-eeee-000000000005', 'Kashmiri Red Chilli', 'Mild Kashmiri chilli for rich color without heat.', 'Kashmiri Chilli', 50.00, 'KG', 550.00, 'INR', 0.25, '2025-11-15', '2026-11-15', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 389, 4.80, 35, NOW(), NOW()),
('ffff0073-ffff-0073-ffff-000000000073', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0005-eeee-0005-eeee-000000000005', 'Cumin Seeds (Jeera)', 'Aromatic cumin seeds. Essential for Indian cooking.', 'Cumin', 80.00, 'KG', 380.00, 'INR', 0.25, '2025-12-10', '2026-12-10', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 345, 4.70, 31, NOW(), NOW()),
('ffff0074-ffff-0074-ffff-000000000074', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0005-eeee-0005-eeee-000000000005', 'Black Pepper (Kali Mirch)', 'Premium Malabar black pepper. Strong aroma and flavor.', 'Black Pepper', 50.00, 'KG', 750.00, 'INR', 0.25, '2025-11-20', '2026-11-20', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 412, 4.85, 38, NOW(), NOW()),
('ffff0075-ffff-0075-ffff-000000000075', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0005-eeee-0005-eeee-000000000005', 'Cardamom (Elaichi)', 'Green cardamom pods. Premium quality for desserts and chai.', 'Cardamom', 20.00, 'KG', 2500.00, 'INR', 0.10, '2025-11-25', '2026-11-25', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 523, 4.90, 48, NOW(), NOW()),
('ffff0076-ffff-0076-ffff-000000000076', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0005-eeee-0005-eeee-000000000005', 'Saffron (Kesar)', 'Premium Kashmiri saffron. World''s most precious spice.', 'Saffron', 1.00, 'KG', 250000.00, 'INR', 0.001, '2025-11-01', '2027-11-01', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 567, 4.95, 52, NOW(), NOW()),
('ffff0091-ffff-0091-ffff-000000000091', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0006-eeee-0006-eeee-000000000006', 'Fresh A2 Cow Milk', 'Pure A2 cow milk from grass-fed cows. No hormones or antibiotics.', 'Milk', 100.00, 'LITRE', 80.00, 'INR', 1.00, '2026-01-19', '2026-01-22', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 234, 4.70, 21, NOW(), NOW()),
('ffff0092-ffff-0092-ffff-000000000092', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0006-eeee-0006-eeee-000000000006', 'Fresh Paneer', 'Homemade fresh paneer from A2 milk. Soft and creamy.', 'Paneer', 30.00, 'KG', 400.00, 'INR', 0.25, '2026-01-19', '2026-01-26', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 312, 4.65, 28, NOW(), NOW()),
('ffff0093-ffff-0093-ffff-000000000093', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0006-eeee-0006-eeee-000000000006', 'Fresh Butter', 'Homemade white butter from A2 milk. Rich and creamy.', 'Butter', 20.00, 'KG', 800.00, 'INR', 0.25, '2026-01-19', '2026-02-19', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 267, 4.75, 24, NOW(), NOW()),
('ffff0098-ffff-0098-ffff-000000000098', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0008-eeee-0008-eeee-000000000008', 'Mango Saplings (Alphonso)', 'Grafted Alphonso mango saplings. Start bearing fruit in 3-4 years.', 'Mango Sapling', 500.00, 'PIECE', 350.00, 'INR', 5.00, '2025-08-01', '2026-08-01', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A+', 'ACTIVE', 312, 4.70, 28, NOW(), NOW()),
('ffff0099-ffff-0099-ffff-000000000099', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0008-eeee-0008-eeee-000000000008', 'Tomato Seeds (Hybrid)', 'High-yield hybrid tomato seeds. Disease resistant variety.', 'Tomato Seeds', 10.00, 'KG', 2500.00, 'INR', 0.10, '2025-10-01', '2026-10-01', 'Pune, Maharashtra', 18.5204, 73.8567, false, 'A', 'ACTIVE', 234, 4.50, 21, NOW(), NOW()),
('ffff0100-ffff-0100-ffff-000000000100', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'eeee0008-eeee-0008-eeee-000000000008', 'Coconut Saplings', 'Hybrid coconut palm saplings. Drought resistant and high yield.', 'Coconut Sapling', 200.00, 'PIECE', 250.00, 'INR', 5.00, '2025-07-01', '2026-07-01', 'Pune, Maharashtra', 18.5204, 73.8567, true, 'A', 'ACTIVE', 156, 4.40, 13, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- LISTING IMAGES
-- =====================================================
INSERT INTO marketplace_schema.listing_images (id, listing_id, image_url, is_primary, sort_order, created_at)
SELECT 
    public.uuid_generate_v4(),
    id,
    CASE 
        WHEN crop_type = 'Tomato' THEN 'https://images.unsplash.com/photo-1546470427-227c8e4d8a1d?w=400'
        WHEN crop_type = 'Capsicum' THEN 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'
        WHEN crop_type = 'Spinach' THEN 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'
        WHEN crop_type = 'Potato' THEN 'https://images.unsplash.com/photo-1518977676601-b53f82ber8a?w=400'
        WHEN crop_type = 'Onion' THEN 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400'
        WHEN crop_type = 'Carrot' THEN 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'
        WHEN crop_type = 'Rice' THEN 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
        WHEN crop_type = 'Wheat' THEN 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'
        WHEN crop_type = 'Mango' THEN 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'
        WHEN crop_type = 'Banana' THEN 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'
        WHEN crop_type = 'Pomegranate' THEN 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'
        WHEN crop_type = 'Grapes' THEN 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400'
        WHEN crop_type = 'Red Chilli' THEN 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400'
        WHEN crop_type = 'Cumin' THEN 'https://images.unsplash.com/photo-1599909533402-72d7a8208e8a?w=400'
        WHEN crop_type = 'Cardamom' THEN 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400'
        WHEN crop_type = 'Milk' THEN 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'
        WHEN crop_type = 'Paneer' THEN 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400'
        WHEN crop_type = 'Honey' THEN 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'
        WHEN crop_type = 'Ghee' THEN 'https://images.unsplash.com/photo-1631898039984-fd5f61fe8730?w=400'
        ELSE 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'
    END,
    true,
    0,
    NOW()
FROM marketplace_schema.listings
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'auth_schema.users' as table_name, COUNT(*) as count FROM auth_schema.users
UNION ALL
SELECT 'auth_schema.roles', COUNT(*) FROM auth_schema.roles
UNION ALL
SELECT 'user_schema.user_profiles', COUNT(*) FROM user_schema.user_profiles
UNION ALL
SELECT 'farm_schema.farms', COUNT(*) FROM farm_schema.farms
UNION ALL
SELECT 'marketplace_schema.categories', COUNT(*) FROM marketplace_schema.categories
UNION ALL
SELECT 'marketplace_schema.listings', COUNT(*) FROM marketplace_schema.listings;

-- =====================================================
-- END OF NEON SEED DATA
-- =====================================================
