import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { ad_id, event_type, viewer_user_id } = await req.json()
    if (!ad_id || !event_type) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    await supabase.from('ad_events').insert({
      ad_id,
      event_type,
      viewer_user_id: viewer_user_id ?? null,
      date: today,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
