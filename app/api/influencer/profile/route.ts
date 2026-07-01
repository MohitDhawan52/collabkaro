import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    // Verify the caller is authenticated
    const serverClient = await createServerSupabaseClient()
    const { data: { user }, error: authErr } = await serverClient.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Use service-role client to bypass RLS — user is already authenticated above
    const supabase = await createAdminSupabaseClient()

    const { error } = await supabase
      .from('influencer_profiles')
      .upsert({ ...body, user_id: user.id }, { onConflict: 'user_id' })

    if (error) {
      console.error('[influencer/profile]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[influencer/profile] unexpected:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
