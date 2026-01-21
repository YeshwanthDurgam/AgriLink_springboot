-- =====================================================
-- AgriLink - Neon Database Initialization Script
-- =====================================================
-- Run this script in your Neon SQL Editor to create all databases
-- https://console.neon.tech > Your Project > SQL Editor

-- =====================================================
-- IMPORTANT: Neon creates databases differently!
-- =====================================================
-- In Neon, you typically create separate "branches" or use schemas
-- within a single database. For simplicity, we'll use schemas.
-- 
-- Option 1: Use separate branches (recommended for production)
-- Option 2: Use schemas within single database (simpler setup)
-- 
-- This script uses Option 2 (schemas)
-- =====================================================

-- Enable UUID extension (should be enabled by default in Neon)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE SCHEMAS FOR EACH SERVICE
-- =====================================================

-- Auth Schema
CREATE SCHEMA IF NOT EXISTS auth;

-- User Schema
CREATE SCHEMA IF NOT EXISTS users;

-- Farm Schema
CREATE SCHEMA IF NOT EXISTS farm;

-- Marketplace Schema
CREATE SCHEMA IF NOT EXISTS marketplace;

-- Order Schema
CREATE SCHEMA IF NOT EXISTS orders;

-- IoT Schema
CREATE SCHEMA IF NOT EXISTS iot;

-- Notification Schema
CREATE SCHEMA IF NOT EXISTS notification;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Replace 'your_neon_role' with your actual Neon role name

GRANT ALL ON SCHEMA auth TO PUBLIC;
GRANT ALL ON SCHEMA users TO PUBLIC;
GRANT ALL ON SCHEMA farm TO PUBLIC;
GRANT ALL ON SCHEMA marketplace TO PUBLIC;
GRANT ALL ON SCHEMA orders TO PUBLIC;
GRANT ALL ON SCHEMA iot TO PUBLIC;
GRANT ALL ON SCHEMA notification TO PUBLIC;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify schemas were created
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'users', 'farm', 'marketplace', 'orders', 'iot', 'notification');
