import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, email, full_name, username, phone, location, gender, bio,
      niche, instagram_handle, youtube_handle, followers_count,
      instagram_post_price, avatar_url } = await req.json()

    if (!user_id || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    // 1. Upsert into profiles table
    const { error: profileErr } = await supabase.from('profiles').upsert(
      { id: user_id, email, role: 'influencer', status: 'pending' },
      { onConflict: 'id' }
    )
    if (profileErr) {
      console.error('[influencer/register] profiles:', profileErr.message)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // 2. Insert influencer_profiles row
    // niche must be an array — wrap string if needed
    const nicheArray = Array.isArray(niche) ? niche : (niche ? [niche] : [])

    const { error: infErr } = await supabase.from('influencer_profiles').upsert({
      user_id,
      full_name,
      username: username || full_name.toLowerCase().replace(/\s+/g, '_'),
      phone: phone || null,
      location: location || null,
      gender: gender || null,
      bio: bio || null,
      niche: nicheArray,
      instagram_handle: instagram_handle || null,
      youtube_handle: youtube_handle || null,
      followers_count: followers_count ? parseInt(followers_count) : null,
      instagram_post_price: instagram_post_price ? parseFloat(instagram_post_price) : null,
      avatar_url: avatar_url || null,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (infErr) {
      console.error('[influencer/register] influencer_profiles:', infErr.message)
      return NextResponse.json({ error: infErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[influencer/register] unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
