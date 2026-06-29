-- ================================================================
-- Migration: Creator Verification Badge + Brand Gig Ads
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  payment_status text NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','unpaid')),
  amount integer NOT NULL DEFAULT 1999,
  applied_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  admin_note text
);

-- 2. Add is_verified column to influencer_profiles
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- 3. Gig ads table
CREATE TABLE IF NOT EXISTS gig_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  brand_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_budget integer NOT NULL,
  total_budget integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused','rejected','ended')),
  strike boolean NOT NULL DEFAULT false,
  strike_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_ads ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — verification_requests
CREATE POLICY IF NOT EXISTS "Users manage own verification requests"
  ON verification_requests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admin reads all verification requests"
  ON verification_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Admin updates verification requests"
  ON verification_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. RLS Policies — gig_ads
CREATE POLICY IF NOT EXISTS "Brands manage own gig ads"
  ON gig_ads FOR ALL
  USING (auth.uid() = brand_user_id);

CREATE POLICY IF NOT EXISTS "Influencers read active gig ads"
  ON gig_ads FOR SELECT
  USING (status = 'active');

CREATE POLICY IF NOT EXISTS "Admin manages all gig ads"
  ON gig_ads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
