-- Migration to add suspension and deletion management fields
-- V9__add_suspension_and_deletion_fields.sql

-- Add columns to user_profiles table for account suspension and deletion tracking
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create index for active users query
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Create index for deleted/suspended users query
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON user_profiles(deleted_at);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.is_active IS 'Flag indicating if user account is active (not suspended or deleted)';
COMMENT ON COLUMN user_profiles.suspension_reason IS 'Reason for account suspension, if any';
COMMENT ON COLUMN user_profiles.suspended_at IS 'Timestamp when account was suspended';
COMMENT ON COLUMN user_profiles.deletion_reason IS 'Reason for account deletion, if any';
COMMENT ON COLUMN user_profiles.deleted_at IS 'Timestamp when account was deleted/soft-deleted';
