import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabaseAdmin'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  try {
    const { userId, subject, html } = await req.json()
    if (!userId || !subject || !html) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Fetch user email via service role
    const admin = createAdminClient()
    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(userId)
    if (userErr || !user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error } = await resend.emails.send({
      from: `CollabKaro <${FROM}>`,
      to: user.email,
      subject,
      html,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
