-- Add shipping address and clothing size to influencer_profiles
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS clothing_size TEXT;
