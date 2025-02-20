-- Remove is_admin column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;