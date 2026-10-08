-- Manual clients added by agency (no CollabKaro account required)
CREATE TABLE IF NOT EXISTS agency_manual_clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  company_name  TEXT NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  industry      TEXT,
  city          TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agency_manual_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owner can manage manual clients"
  ON agency_manual_clients FOR ALL
  USING (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()))
  WITH CHECK (agency_id IN (SELECT id FROM agency_profiles WHERE user_id = auth.uid()));
