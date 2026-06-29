import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const GST = 0.18

// Called by Vercel Cron daily at midnight IST (18:30 UTC)
// Also callable manually by admin: POST /api/ads/process
// Protected by CRON_SECRET env var
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  // 1. Fetch all active ads
  const { data: activeAds, error: adsErr } = await supabase
    .from('gig_ads')
    .select('id, gig_id, brand_user_id, daily_budget, run_continuously, start_date, end_date')
    .eq('status', 'active')

  if (adsErr) return NextResponse.json({ error: adsErr.message }, { status: 500 })
  if (!activeAds || activeAds.length === 0) return NextResponse.json({ ok: true, processed: 0 })

  const results = { charged: 0, paused_no_funds: 0, ended_date: 0, skipped_not_started: 0 }

  for (const ad of activeAds) {
    // Skip if campaign hasn't started yet
    if (ad.start_date > today) { results.skipped_not_started++; continue }

    // End if past end_date
    if (!ad.run_continuously && ad.end_date && ad.end_date < today) {
      await supabase.from('gig_ads').update({ status: 'ended' }).eq('id', ad.id)
      await supabase.from('notifications').insert({
        user_id: ad.brand_user_id,
        title: 'Ad Campaign Ended',
        message: 'Your ad campaign has ended as per the scheduled end date.',
        type: 'info',
      })
      results.ended_date++
      continue
    }

    // Check if already charged today (idempotency)
    const { count } = await supabase
      .from('wallet_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('ad_id', ad.id)
      .eq('type', 'debit')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)

    if ((count ?? 0) > 0) continue // already charged today

    // Fetch current wallet balance
    const { data: wallet } = await supabase
      .from('brand_wallet')
      .select('id, balance')
      .eq('brand_user_id', ad.brand_user_id)
      .single()

    const balance = wallet?.balance ?? 0
    const deduction = parseFloat((ad.daily_budget * (1 + GST)).toFixed(2))
    const gstAmount = parseFloat((ad.daily_budget * GST).toFixed(2))

    if (balance < deduction) {
      // Insufficient funds — pause ad and notify
      await supabase.from('gig_ads').update({ status: 'paused' }).eq('id', ad.id)
      await supabase.from('notifications').insert({
        user_id: ad.brand_user_id,
        title: 'Ad Paused — Insufficient Funds',
        message: `Your ad was paused because your wallet balance (₹${balance.toFixed(2)}) is less than today's charge of ₹${deduction.toFixed(2)}. Add funds to resume.`,
        type: 'warning',
      })
      results.paused_no_funds++
      continue
    }

    // Deduct from wallet
    const newBalance = parseFloat((balance - deduction).toFixed(2))
    await supabase.from('brand_wallet').update({ balance: newBalance }).eq('brand_user_id', ad.brand_user_id)

    // Log transaction
    await supabase.from('wallet_transactions').insert({
      brand_user_id: ad.brand_user_id,
      type: 'debit',
      amount: ad.daily_budget,
      total_amount: deduction,
      gst_amount: gstAmount,
      description: `Daily ad spend — ${today}`,
      balance_after: newBalance,
      ad_id: ad.id,
    })

    results.charged++
  }

  return NextResponse.json({ ok: true, date: today, ...results })
}

// Vercel Cron invokes GET — proxy to POST handler
export async function GET(req: NextRequest) {
  return POST(req)
}
