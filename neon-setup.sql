-- =====================================================
-- AgriLink - Neon Database Setup Script
-- =====================================================
-- Run this script in your Neon SQL Editor to set up all databases
-- Go to: https://console.neon.tech > Your Project > SQL Editor
-- 
-- IMPORTANT: Run each section one at a time in order!
-- =====================================================

-- =====================================================
-- SECTION 1: Enable Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 2: Create Databases
-- =====================================================
-- NOTE: In Neon, you need to create databases from the Dashboard
-- Go to: Dashboard > Databases > Create Database
-- Create these databases:
--   1. agrilink_auth
--   2. agrilink_user
--   3. agrilink_farm
--   4. agrilink_marketplace
--   5. agrilink_order
--   6. agrilink_iot
--   7. agrilink_notification

-- =====================================================
-- SECTION 3: Connection String Format
-- =====================================================
-- Your connection strings will look like this:
-- jdbc:postgresql://ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/agrilink_auth?sslmode=require

-- =====================================================
-- SECTION 4: Test Query (Run after creating databases)
-- =====================================================
-- Switch to each database and run:
SELECT current_database(), current_user, version();

-- =====================================================
-- SECTION 5: Grant Permissions (if needed)
-- =====================================================
-- Run this in each database if you have permission issues:
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
