-- Add collab_open field to influencer_profiles
-- Values: 'paid' | 'barter' | 'both'
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS collab_open TEXT CHECK (collab_open IN ('paid', 'barter', 'both'));
