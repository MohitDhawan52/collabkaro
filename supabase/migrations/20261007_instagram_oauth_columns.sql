-- Add Instagram OAuth verification columns to influencer_profiles
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS instagram_user_id TEXT,
  ADD COLUMN IF NOT EXISTS instagram_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Auto-approve all existing brand profiles that are still pending
UPDATE profiles SET status = 'approved'
WHERE role = 'brand' AND status = 'pending';
