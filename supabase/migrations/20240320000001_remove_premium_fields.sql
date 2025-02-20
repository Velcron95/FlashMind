-- Remove premium-related columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS is_premium,
DROP COLUMN IF EXISTS premium_until; 