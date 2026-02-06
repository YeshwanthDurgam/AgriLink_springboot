-- =====================================================
-- AgriLink Database Initialization Script
-- =====================================================

-- Create databases for each service
CREATE DATABASE agrilink_auth;
CREATE DATABASE agrilink_user;
CREATE DATABASE agrilink_farm;
CREATE DATABASE agrilink_marketplace;
CREATE DATABASE agrilink_order;
CREATE DATABASE agrilink_notification;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agrilink_auth TO agrilink;
GRANT ALL PRIVILEGES ON DATABASE agrilink_user TO agrilink;
GRANT ALL PRIVILEGES ON DATABASE agrilink_farm TO agrilink;
GRANT ALL PRIVILEGES ON DATABASE agrilink_marketplace TO agrilink;
GRANT ALL PRIVILEGES ON DATABASE agrilink_order TO agrilink;
GRANT ALL PRIVILEGES ON DATABASE agrilink_notification TO agrilink;

-- Enable UUID extension for all databases
\c agrilink_auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c agrilink_user
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c agrilink_farm
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c agrilink_marketplace
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c agrilink_order
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c agrilink_notification
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- NOTE: Run seed-data.sql after Spring Boot creates 
-- the tables to populate with sample data.
-- =====================================================
