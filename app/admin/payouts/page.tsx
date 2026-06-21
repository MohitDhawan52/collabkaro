'use client'

import { useEffect, useState } from 'react'
import { Wallet, CheckCircle2, Clock, IndianRupee, RefreshCw, AlertTriangle, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notifications'

interface PendingInfluencer {
  user_id: string
  influencer_id: string
  full_name: string
  instagram_handle: string | null
  kyc_status: string | null
  collabs: { id: string; title: string; net: number }[]
  gross: number
  fee: number
  net: number
}

interface PayoutCycleRow {
  id: string
  cycle_date: string
  amount: number
  platform_fee: number
  net_amount: number
  status: string
  processed_at: string | null
  notes: string | null
  influencer_profiles?: { full_name: string | null } | null
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function nextPayoutDate() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), 20)
  if (now.getDate() > 20) d.setMonth(d.getMonth() + 1)
  return d
}

const PLATFORM_FEE_PCT = 0.10

export default function AdminPayoutsPage() {
  const [pending, setPending] = useState<PendingInfluencer[]>([])
  const [history, setHistory] = useState<PayoutCycleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [tab, setTab] = useState<'pending' | 'history'>('pending')

  const cycleDate = nextPayoutDate()
  const cycleDateStr = cycleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const cycleISO = cycleDate.toISOString().split('T')[0]

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    // Fetch all completed collabs where influencer hasn't been paid yet
    const { data: collabs, error } = await supabase
      .from('collaborations')
      .select('id, agreed_amount, influencer_payout, influencer_id, influencer_payment_status, gigs(title), influencer_profiles(id, full_name, instagram_handle, user_id)')
      .eq('status', 'completed')
      .eq('influencer_payment_status', 'pending')
      .eq('collab_type', 'paid')

    if (error) { toast.error(error.message); setLoading(false); return }

    // Group by influencer
    const map: Record<string, PendingInfluencer> = {}
    for (const c of collabs ?? []) {
      const inf = c.influencer_profiles as { id: string; full_name: string | null; instagram_handle: string | null; user_id: string } | null
      if (!inf) continue
      const gross = c.influencer_payout ?? c.agreed_amount ?? 0
      const fee = Math.round(gross * PLATFORM_FEE_PCT)
      const net = gross - fee
      if (!map[inf.user_id]) {
        map[inf.user_id] = { user_id: inf.user_id, influencer_id: inf.id, full_name: inf.full_name ?? 'Unknown', instagram_handle: inf.instagram_handle, kyc_status: null, collabs: [], gross: 0, fee: 0, net: 0 }
      }
      map[inf.user_id].collabs.push({ id: c.id, title: (c.gigs as { title: string | null } | null)?.title ?? 'Collaboration', net })
      map[inf.user_id].gross += gross
      map[inf.user_id].fee += fee
      map[inf.user_id].net += net
    }

    // Fetch KYC statuses
    const userIds = Object.keys(map)
    if (userIds.length > 0) {
      const { data: kycs } = await supabase.from('kyc_documents').select('user_id, status').in('user_id', userIds)
      for (const k of kycs ?? []) {
        if (map[k.user_id]) map[k.user_id].kyc_status = k.status
      }
    }

    setPending(Object.values(map))

    // Fetch payout history
    const { data: hist } = await supabase
      .from('payout_cycles')
      .select('*, influencer_profiles(full_name)')
      .order('cycle_date', { ascending: false })
      .limit(100)
    setHistory((hist ?? []) as PayoutCycleRow[])

    setLoading(false)
  }

  async function processPayout(inf: PendingInfluencer) {
    if (inf.kyc_status !== 'approved') {
      toast.error(`${inf.full_name}'s KYC is not approved. Cannot process payout.`)
      return
    }
    if (!confirm(`Process ₹${inf.net.toLocaleString('en-IN')} payout for ${inf.full_name}?`)) return
    setProcessing(inf.user_id)
    const supabase = createClient()

    // Insert payout cycle record
    const { error: cycleErr } = await supabase.from('payout_cycles').insert({
      user_id: inf.user_id,
      influencer_id: inf.influencer_id,
      cycle_date: cycleISO,
      amount: inf.gross,
      platform_fee: inf.fee,
      net_amount: inf.net,
      collab_ids: inf.collabs.map(c => c.id),
      status: 'paid',
      processed_at: new Date().toISOString(),
    })
    if (cycleErr) { toast.error(cycleErr.message); setProcessing(null); return }

    // Mark all collabs as paid
    const { error: collabErr } = await supabase
      .from('collaborations')
      .update({ influencer_payment_status: 'released' })
      .in('id', inf.collabs.map(c => c.id))
    if (collabErr) { toast.error(collabErr.message); setProcessing(null); return }

    // Insert payment record
    await supabase.from('payments').insert({
      user_id: inf.user_id,
      type: 'influencer_payout',
      amount: inf.net,
      status: 'paid',
      description: `Monthly payout — ${cycleDateStr}`,
    })

    // Notify influencer
    await notify(inf.user_id, '💰 Payout Processed!', `Your earnings of ${formatINR(inf.net)} have been released for the ${cycleDateStr} cycle. Check your bank account within 2-3 business days.`, 'system')

    toast.success(`Payout of ${formatINR(inf.net)} processed for ${inf.full_name}`)
    setProcessing(null)
    load()
  }

  async function processAll() {
    const eligible = pending.filter(p => p.kyc_status === 'approved')
    if (eligible.length === 0) { toast.error('No KYC-approved influencers with pending payouts'); return }
    if (!confirm(`Process payouts for ALL ${eligible.length} eligible influencers? Total: ${formatINR(eligible.reduce((s,p) => s + p.net, 0))}`)) return
    for (const inf of eligible) await processPayout(inf)
  }

  const totalPending = pending.filter(p => p.kyc_status === 'approved').reduce((s, p) => s + p.net, 0)
  const CARD: React.CSSProperties = { background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 18, padding: '20px', backdropFilter: 'blur(14px)', boxShadow: '0 2px 12px rgba(29,78,216,0.07)', marginBottom: 14 }

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0c1445', letterSpacing: -0.4 }}>Payouts</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Monthly payouts on the 20th — release earnings to influencers</div>
        </div>
      </div>

      {/* Next payout cycle banner */}
      <div style={{ padding: '18px 22px', borderRadius: 18, background: 'linear-gradient(135deg,rgba(5,150,105,0.08),rgba(16,185,129,0.05))', border: '1.5px solid rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarDays size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#064e3b' }}>Next Cycle: {cycleDateStr}</div>
            <div style={{ fontSize: 13, color: '#059669', marginTop: 2 }}>{pending.filter(p => p.kyc_status === 'approved').length} influencer{pending.filter(p => p.kyc_status === 'approved').length !== 1 ? 's' : ''} eligible · {formatINR(totalPending)} ready to release</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: '1px solid rgba(5,150,105,0.3)', background: '#fff', color: '#059669', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {pending.filter(p => p.kyc_status === 'approved').length > 1 && (
            <button onClick={processAll} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 12px rgba(5,150,105,0.3)' }}>
              <CheckCircle2 size={14} /> Process All ({formatINR(totalPending)})
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 20px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === t ? 'linear-gradient(135deg,#1d4ed8,#06b6d4)' : 'rgba(255,255,255,0.65)', color: tab === t ? '#fff' : '#374151', boxShadow: tab === t ? '0 2px 10px rgba(29,78,216,0.25)' : '0 1px 4px rgba(0,0,0,0.07)' }}>
            {t === 'pending' ? `Pending (${pending.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {loading && [1,2,3].map(i => <div key={i} style={{ height: 90, borderRadius: 16, background: 'rgba(255,255,255,0.5)', marginBottom: 12 }} />)}

      {/* Pending tab */}
      {!loading && tab === 'pending' && (
        pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af', fontSize: 15 }}>
            No pending payouts. All influencers have been paid! 🎉
          </div>
        ) : (
          pending.map(inf => (
            <div key={inf.user_id} style={CARD}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,rgba(29,78,216,0.12),rgba(6,182,212,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: 17, color: '#1d4ed8' }}>{inf.full_name[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>
                      {inf.full_name} {inf.instagram_handle && <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13 }}>@{inf.instagram_handle}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 2 }}>{inf.collabs.length} collab{inf.collabs.length !== 1 ? 's' : ''} completed</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {inf.kyc_status !== 'approved' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      <AlertTriangle size={12} /> KYC {inf.kyc_status ?? 'not submitted'}
                    </div>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Gross · Fee · Net</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0c1445', marginTop: 2 }}>
                      {formatINR(inf.gross)} · <span style={{ color: '#dc2626' }}>−{formatINR(inf.fee)}</span> · <span style={{ color: '#059669' }}>{formatINR(inf.net)}</span>
                    </div>
                  </div>
                  <button
                    disabled={inf.kyc_status !== 'approved' || processing === inf.user_id}
                    onClick={() => processPayout(inf)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12, border: 'none', background: inf.kyc_status === 'approved' ? 'linear-gradient(135deg,#059669,#10b981)' : 'rgba(0,0,0,0.08)', color: inf.kyc_status === 'approved' ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 13, cursor: inf.kyc_status === 'approved' ? 'pointer' : 'not-allowed', boxShadow: inf.kyc_status === 'approved' ? '0 3px 12px rgba(5,150,105,0.3)' : 'none', opacity: processing === inf.user_id ? 0.6 : 1, whiteSpace: 'nowrap' }}
                  >
                    <IndianRupee size={13} /> {processing === inf.user_id ? 'Processing…' : `Pay ${formatINR(inf.net)}`}
                  </button>
                </div>
              </div>

              {/* Collab breakdown */}
              <div style={{ marginTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {inf.collabs.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#374151' }}>
                    <span>{c.title}</span>
                    <span style={{ fontWeight: 600, color: '#059669' }}>{formatINR(c.net)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )
      )}

      {/* History tab */}
      {!loading && tab === 'history' && (
        history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af', fontSize: 15 }}>No payout history yet.</div>
        ) : (
          history.map(row => (
            <div key={row.id} style={{ ...CARD, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: row.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {row.status === 'paid' ? <CheckCircle2 size={16} style={{ color: '#059669' }} /> : <Clock size={16} style={{ color: '#ea580c' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445' }}>
                      {(row.influencer_profiles as { full_name: string | null } | null | undefined)?.full_name ?? 'Influencer'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {new Date(row.cycle_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {row.notes && ` · ${row.notes}`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#059669' }}>{formatINR(row.net_amount)}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
                    Gross {formatINR(row.amount)} · Fee {formatINR(row.platform_fee)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )
      )}
    </div>
  )
}
