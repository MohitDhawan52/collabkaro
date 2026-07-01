import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/influencer/profile' })
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: `Missing env: url=${!!url} key=${!!key}` }, { status: 500 })
    }

    const supabase = getAdminClient()
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

    // Ensure profiles row exists
    await supabase.from('profiles').update({ role: 'influencer', status: 'pending' }).eq('id', userId)
    await supabase.from('profiles').insert({ id: userId, email: userEmail ?? '', role: 'influencer', status: 'pending' }).then(() => {})

    const profileData: Record<string, unknown> = { ...body, user_id: userId }
    if (profileData.niche && !Array.isArray(profileData.niche)) {
      profileData.niche = [profileData.niche]
    }

    const { error: updateErr } = await supabase.from('influencer_profiles').update(profileData).eq('user_id', userId)
    if (updateErr) {
      const { error: insertErr } = await supabase.from('influencer_profiles').insert(profileData)
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
