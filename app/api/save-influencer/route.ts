import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/save-influencer' })
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: `Missing env: url=${!!url} key=${!!key}` }, { status: 500 })
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let userId: string | null = null
    let userEmail: string | null = null

    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) { userId = user.id; userEmail = user.email ?? null }
    }

    const body = await req.json().catch(() => ({}))

    if (!userId && body.user_id) {
      const { data: { user } } = await supabase.auth.admin.getUserById(body.user_id)
      if (user) { userId = user.id; userEmail = user.email ?? null }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 1: profiles row MUST exist first (influencer_profiles has FK to profiles)
    const { error: profilesErr } = await supabase.from('profiles').upsert(
      { id: userId, email: userEmail ?? '', role: 'influencer', status: 'pending' },
      { onConflict: 'id' }
    )
    if (profilesErr) return NextResponse.json({ error: `profiles: ${profilesErr.message}` }, { status: 500 })

    // Step 2: insert influencer_profiles
    const profileData: Record<string, unknown> = { ...body, user_id: userId }
    delete profileData.email
    if (profileData.niche && !Array.isArray(profileData.niche)) {
      profileData.niche = [profileData.niche]
    }

    const { error: insertErr } = await supabase.from('influencer_profiles').insert(profileData)
    if (insertErr) {
      if (insertErr.code === '23505') {
        const { error: updateErr } = await supabase
          .from('influencer_profiles')
          .update(profileData)
          .eq('user_id', userId)
        if (updateErr) return NextResponse.json({ error: `update: ${updateErr.message}` }, { status: 500 })
      } else {
        return NextResponse.json({ error: `insert failed [${insertErr.code}]: ${insertErr.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
