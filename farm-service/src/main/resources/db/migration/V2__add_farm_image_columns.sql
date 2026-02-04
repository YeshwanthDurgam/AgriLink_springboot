-- V2: Add crop_types and farm_image_url columns to farms table

-- Add crop_types column for storing crop types (comma-separated or JSON)
ALTER TABLE farms ADD COLUMN IF NOT EXISTS crop_types TEXT;

-- Add farm_image_url column for storing farm photo (can be base64 or URL)
ALTER TABLE farms ADD COLUMN IF NOT EXISTS farm_image_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN farms.crop_types IS 'Types of crops grown on the farm (e.g., Rice, Wheat, Vegetables)';
COMMENT ON COLUMN farms.farm_image_url IS 'URL or base64 encoded image of the farm';
