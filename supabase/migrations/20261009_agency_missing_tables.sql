-- ============================================================
-- Agency panel: missing tables + missing columns
-- Run this entire block in Supabase SQL editor
-- ============================================================

-- 1. Add missing columns to agency_profiles
ALTER TABLE agency_profiles
  ADD COLUMN IF NOT EXISTS website       TEXT,
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS gst_number    TEXT,
  ADD COLUMN IF NOT EXISTS city          TEXT;

-- 2. agency_roster — influencer shortlist per agency
CREATE TABLE IF NOT EXISTS agency_roster (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id      UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  influencer_id  UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, influencer_id)
);
ALTER TABLE agency_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency owner can manage roster" ON agency_roster;
CREATE POLICY "Agency owner can manage roster"
  ON agency_roster FOR ALL
  USING (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()))
  WITH CHECK (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()));

-- 3. agency_team_members — internal team per agency
CREATE TABLE IF NOT EXISTS agency_team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id  UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin','manager','viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE agency_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency owner can manage team" ON agency_team_members;
CREATE POLICY "Agency owner can manage team"
  ON agency_team_members FOR ALL
  USING (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()))
  WITH CHECK (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()));

-- 4. Add agency_id to collaborations (for collabs page filter)
ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL;
