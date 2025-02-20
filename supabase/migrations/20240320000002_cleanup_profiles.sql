-- Remove premium-related columns and clean up profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS is_premium,
DROP COLUMN IF EXISTS premium_until;

-- Ensure basic profile columns exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0; 