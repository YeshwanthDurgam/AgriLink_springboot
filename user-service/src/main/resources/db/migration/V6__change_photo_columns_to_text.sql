-- V6: Change profile_photo and farm_photo columns to TEXT to support base64 images

ALTER TABLE farmers ALTER COLUMN profile_photo TYPE TEXT;
ALTER TABLE farmers ALTER COLUMN farm_photo TYPE TEXT;
