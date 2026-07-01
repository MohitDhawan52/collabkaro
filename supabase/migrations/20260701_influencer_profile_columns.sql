-- ================================================================
-- Migration: Add missing columns to influencer_profiles
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================================

-- Profile photo URL
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Username / handle on the platform
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Phone number
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- YouTube channel handle (the register form uses youtube_handle, not youtube_channel)
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS youtube_handle text;

-- Total followers count (quick summary field)
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS followers_count integer;

-- ================================================================
-- Missing columns referenced by the ads / analytics features
-- ================================================================

-- Already in previous migration but guard with IF NOT EXISTS
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- ================================================================
-- influencer_limit on gigs (needed for slot progress bars)
-- ================================================================
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS influencer_limit integer NOT NULL DEFAULT 1;

-- ================================================================
-- ad_events table (impression / view / pitch_click tracking)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.gig_ads(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'view', 'pitch_click')),
  viewer_user_id uuid REFERENCES auth.users(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role bypass" ON public.ad_events;
CREATE POLICY "service role bypass" ON public.ad_events USING (true) WITH CHECK (true);

-- ================================================================
-- wallet_transactions extra columns
-- ================================================================
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS brand_user_id uuid REFERENCES auth.users(id);
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS gst_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS ad_id uuid REFERENCES public.gig_ads(id);
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS balance_after numeric;
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS date date;

-- ================================================================
-- brand_wallet table (prepaid wallet for ad spend)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.brand_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.brand_wallet ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brand own wallet" ON public.brand_wallet;
CREATE POLICY "brand own wallet" ON public.brand_wallet
  USING (auth.uid() = brand_user_id)
  WITH CHECK (auth.uid() = brand_user_id);

-- ================================================================
-- KYC documents table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  pan_number text,
  pan_image_url text,
  aadhaar_number text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- ================================================================
-- Enable Supabase Realtime on key tables (safe — skips if already added)
-- ================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gig_ads;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
