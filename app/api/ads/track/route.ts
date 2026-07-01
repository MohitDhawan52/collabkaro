import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const VALID_EVENTS = ['impression', 'view', 'pitch_click']

export async function POST(req: NextRequest) {
  try {
    const { ad_id, event_type, viewer_user_id } = await req.json()
    if (!ad_id || !VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ ok: false, error: 'Missing or invalid ad_id/event_type' }, { status: 400 })
    }

    const supabase = getAdminClient()
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
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
