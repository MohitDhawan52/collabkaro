import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { ad_id, event_type, viewer_user_id } = await req.json()
    if (!ad_id || !event_type) {
      return NextResponse.json({ ok: false, error: 'Missing ad_id or event_type' }, { status: 400 })
    }

    // Service-role client bypasses RLS — tracking must always succeed
    const supabase = await createAdminSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('ad_events').insert({
      ad_id,
      event_type,
      viewer_user_id: viewer_user_id ?? null,
      date: today,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[ads/track]', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ads/track] unexpected:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
