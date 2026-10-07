-- Add plan column to verification_requests for two-tier subscription
ALTER TABLE verification_requests
  ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('starter', 'pro')) DEFAULT 'starter';
