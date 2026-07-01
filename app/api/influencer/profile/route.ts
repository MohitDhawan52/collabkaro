import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var' }, { status: 500 })
    }

    // Verify caller is authenticated via session cookie
    const serverClient = await createServerSupabaseClient()
    const { data: { user }, error: authErr } = await serverClient.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const supabase = await createAdminSupabaseClient()

    // Ensure profiles row exists (for login routing)
    await supabase.from('profiles')
      .update({ role: 'influencer', status: 'pending' })
      .eq('id', user.id)
    // If no row existed, insert it (ignore error if already present)
    await supabase.from('profiles')
      .insert({ id: user.id, email: user.email ?? '', role: 'influencer', status: 'pending' })
      .then(() => {}) // fire and forget — upsert conflict is fine

    // niche must be an array
    const profileData = { ...body, user_id: user.id }
    if (profileData.niche && !Array.isArray(profileData.niche)) {
      profileData.niche = [profileData.niche]
    }

    // Try UPDATE first, then INSERT — avoids needing unique constraint
    const { error: updateErr } = await supabase
      .from('influencer_profiles')
      .update(profileData)
      .eq('user_id', user.id)

    if (updateErr) {
      const { error: insertErr } = await supabase
        .from('influencer_profiles')
        .insert(profileData)

      if (insertErr) {
        console.error('[influencer/profile] insert error:', insertErr.message)
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
