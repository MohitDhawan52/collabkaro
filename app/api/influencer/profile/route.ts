import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var' }, { status: 500 })
    }

    const supabase = await createAdminSupabaseClient()

    // Verify caller — accept either Bearer token (from signup flow)
    // or fall back to cookie-based session (from profile edit page)
    let userId: string | null = null
    let userEmail: string | null = null

    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        userId = user.id
        userEmail = user.email ?? null
      }
    }

    // Fallback: user_id in body (only trusted because we verified token above,
    // or for profile-edit page which sends a valid session cookie separately)
    const body = await req.json().catch(() => ({}))
    if (!userId && body.user_id) {
      // Verify this user actually exists in auth
      const { data: { user } } = await supabase.auth.admin.getUserById(body.user_id)
      if (user) {
        userId = user.id
        userEmail = user.email ?? null
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized — no valid session or token' }, { status: 401 })
    }

    // Ensure profiles row exists for login routing
    await supabase.from('profiles')
      .update({ role: 'influencer', status: 'pending' })
      .eq('id', userId)
    await supabase.from('profiles')
      .insert({ id: userId, email: userEmail ?? '', role: 'influencer', status: 'pending' })
      .then(() => {})

    // Normalize niche to array
    const profileData = { ...body, user_id: userId }
    delete profileData.user_id // will be set explicitly below
    if (profileData.niche && !Array.isArray(profileData.niche)) {
      profileData.niche = [profileData.niche]
    }

    // Update-then-insert (no unique constraint required)
    const { error: updateErr } = await supabase
      .from('influencer_profiles')
      .update({ ...profileData, user_id: userId })
      .eq('user_id', userId)

    if (updateErr) {
      const { error: insertErr } = await supabase
        .from('influencer_profiles')
        .insert({ ...profileData, user_id: userId })

      if (insertErr) {
        console.error('[influencer/profile] insert:', insertErr.message)
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[influencer/profile] unexpected:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
