import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var' }, { status: 500 })
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL env var' }, { status: 500 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

    const { user_id, email, full_name, username, phone, location, gender, bio,
      niche, instagram_handle, youtube_handle, followers_count,
      instagram_post_price, avatar_url } = body

    if (!user_id || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields: user_id, full_name, email' }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    // ── Step 1: profiles table ──────────────────────────────────────────────
    // Try UPDATE first (row may already exist from Supabase auth trigger)
    const { error: updateProfileErr } = await supabase
      .from('profiles')
      .update({ role: 'influencer', status: 'pending' })
      .eq('id', user_id)

    if (updateProfileErr) {
      // Row doesn't exist yet — try INSERT
      const { error: insertProfileErr } = await supabase
        .from('profiles')
        .insert({ id: user_id, email, role: 'influencer', status: 'pending' })

      if (insertProfileErr) {
        // If still failing, it's a schema issue — log and continue (don't block profile creation)
        console.error('[influencer/register] profiles table error:', insertProfileErr.message)
        // Not a fatal error — influencer_profiles is what matters for the app
      }
    }

    // ── Step 2: influencer_profiles table ───────────────────────────────────
    const nicheArray = Array.isArray(niche) ? niche : (niche ? [niche] : [])
    const profileData = {
      user_id,
      full_name,
      username: username || full_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      phone: phone || null,
      location: location || null,
      gender: gender || null,
      bio: bio || null,
      niche: nicheArray,
      instagram_handle: instagram_handle || null,
      youtube_handle: youtube_handle || null,
      followers_count: followers_count ? parseInt(String(followers_count)) : null,
      instagram_post_price: instagram_post_price ? parseFloat(String(instagram_post_price)) : null,
      avatar_url: avatar_url || null,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    }

    // Try UPDATE first (in case partial row already exists)
    const { error: updateErr } = await supabase
      .from('influencer_profiles')
      .update(profileData)
      .eq('user_id', user_id)

    if (updateErr) {
      // Row doesn't exist — INSERT
      const { error: insertErr } = await supabase
        .from('influencer_profiles')
        .insert(profileData)

      if (insertErr) {
        console.error('[influencer/register] influencer_profiles insert error:', insertErr.message)
        return NextResponse.json({ error: `Could not create profile: ${insertErr.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[influencer/register] unexpected:', msg)
    return NextResponse.json({ error: `Unexpected error: ${msg}` }, { status: 500 })
  }
}
