-- Agency panel tables

-- 1. Agency profiles
CREATE TABLE IF NOT EXISTS agency_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  agency_name TEXT NOT NULL,
  website     TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  gst_number  TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Agency clients (links an agency to brand accounts they manage)
CREATE TABLE IF NOT EXISTS agency_clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  brand_id    UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, brand_id)
);

-- 3. Agency team members
CREATE TABLE IF NOT EXISTS agency_team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, email)
);

-- 4. Agency influencer roster (private shortlist)
CREATE TABLE IF NOT EXISTS agency_roster (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  influencer_id   UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, influencer_id)
);

-- 5. Add agency_id to gigs so agency-posted gigs are tracked
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL;

-- 6. Add agency_id to collaborations for cross-client reporting
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL;

-- 7. Add 'agency' role to profiles (if role column uses CHECK constraint, extend it)
-- If profiles.role has a CHECK constraint, run: ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- Then re-add:
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('influencer', 'brand', 'admin', 'agency'));

-- RLS policies (enable RLS then add policies)
ALTER TABLE agency_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_team_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_roster          ENABLE ROW LEVEL SECURITY;

-- Agency profiles: owner can read/write
CREATE POLICY "Agency owner can manage own profile"
  ON agency_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Agency clients: agency owner can manage
CREATE POLICY "Agency owner can manage clients"
  ON agency_clients FOR ALL
  USING (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()));

-- Team members: agency owner can manage
CREATE POLICY "Agency owner can manage team"
  ON agency_team_members FOR ALL
  USING (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()));

-- Roster: agency owner can manage
CREATE POLICY "Agency owner can manage roster"
  ON agency_roster FOR ALL
  USING (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()));
