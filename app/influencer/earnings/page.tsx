'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, CheckCircle2, Clock, ShieldCheck, AlertTriangle, CalendarDays, IndianRupee, Info } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Payment, Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Returns the next 20th-of-month date (today if today is the 20th) */
function nextPayoutDate(): Date {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), 20)
  if (now.getDate() > 20) next.setMonth(next.getMonth() + 1)
  return next
}

function daysUntilPayout(): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const payout = nextPayoutDate(); payout.setHours(0,0,0,0)
  return Math.round((payout.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

interface PayoutCycle {
  id: string
  cycle_date: string
  amount: number
  platform_fee: number
  net_amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  processed_at: string | null
  notes: string | null
}

export default function EarningsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [pendingCollabs, setPendingCollabs] = useState<Collaboration[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [kycStatus, setKycStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted')
  const [payoutCycles, setPayoutCycles] = useState<PayoutCycle[]>([])

  const days = daysUntilPayout()
  const nextDate = nextPayoutDate()
  const nextDateStr = nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: influencer } = await supabase
        .from('influencer_profiles').select('id').eq('user_id', user.id).single()
      if (!influencer) { setLoading(false); return }

      const { data: kyc } = await supabase
        .from('kyc_documents').select('status').eq('user_id', user.id).single()
      setKycStatus(kyc ? kyc.status as 'pending' | 'approved' | 'rejected' : 'not_submitted')

      const [paymentsRes, collabsRes, cyclesRes] = await Promise.all([
        supabase.from('payments').select('*').eq('user_id', user.id).eq('type', 'influencer_payout').order('created_at', { ascending: false }),
        supabase.from('collaborations').select('*, gigs(title), brand_profiles(brand_name)').eq('influencer_id', influencer.id).neq('status', 'cancelled').neq('status', 'disputed'),
        supabase.from('payout_cycles').select('*').eq('user_id', user.id).order('cycle_date', { ascending: false }),
      ])

      const paid = (paymentsRes.data ?? []).filter((p) => p.status === 'paid')
      setPayments(paid as unknown as Payment[])
      setTotalEarned(paid.reduce((sum, p) => sum + (p.amount ?? 0), 0))

      const pending = ((collabsRes.data as unknown as Collaboration[]) ?? []).filter(
        (c) => c.influencer_payment_status === 'pending' &&
          ['active', 'deliverable_submitted', 'agreement_signed_brand', 'agreement_signed_influencer'].includes(c.status)
      )
      const completed = ((collabsRes.data as unknown as Collaboration[]) ?? []).filter(
        (c) => c.status === 'completed' && c.influencer_payment_status === 'pending'
      )
      const allPending = [...pending, ...completed]
      setPendingCollabs(allPending)
      setPendingAmount(allPending.reduce((sum, c) => sum + (c.influencer_payout ?? c.agreed_amount ?? 0), 0))
      setPayoutCycles((cyclesRes.data ?? []) as PayoutCycle[])

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="dash-page-title">Earnings & Wallet</div>
      <div className="dash-page-subtitle">Track your payouts and upcoming payments.</div>

      {/* KYC banner */}
      {!loading && kycStatus !== 'approved' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 16, marginTop: 20, background: kycStatus === 'pending' ? 'rgba(249,115,22,0.07)' : 'rgba(239,68,68,0.07)', border: `1.5px solid ${kycStatus === 'pending' ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {kycStatus === 'pending' ? <Clock size={18} style={{ color: '#ea580c', flexShrink: 0 }} /> : <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: kycStatus === 'pending' ? '#9a3412' : '#7f1d1d' }}>
                {kycStatus === 'pending' ? 'KYC Under Review' : kycStatus === 'rejected' ? 'KYC Rejected — Re-submit Required' : 'KYC Verification Required'}
              </div>
              <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
                {kycStatus === 'pending' ? 'Your documents are being verified. Payouts will be enabled once approved.' : 'Complete KYC to unlock payout eligibility.'}
              </div>
            </div>
          </div>
          <Link href="/influencer/kyc" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            <ShieldCheck size={13} /> {kycStatus === 'rejected' ? 'Re-submit KYC' : kycStatus === 'pending' ? 'View Status' : 'Complete KYC'}
          </Link>
        </div>
      )}

      {/* Next Payout Countdown */}
      <div style={{ marginTop: 22, padding: '20px 22px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(29,78,216,0.08), rgba(6,182,212,0.06))', border: '1.5px solid rgba(29,78,216,0.15)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CalendarDays size={22} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0c1445' }}>
            Next Payout: {nextDateStr}
            {days === 0 && <span style={{ marginLeft: 10, fontSize: 13, color: '#059669', fontWeight: 700 }}>🎉 Today!</span>}
            {days > 0 && <span style={{ marginLeft: 10, fontSize: 13, color: '#1d4ed8', fontWeight: 700 }}>in {days} day{days !== 1 ? 's' : ''}</span>}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
            CollabKaro processes all influencer payouts on the <strong>20th of every month</strong>. Earnings from completed collabs are included in the next cycle.
          </div>
        </div>
        {pendingAmount > 0 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Queued for payout</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 2 }}>{formatINR(pendingAmount)}</div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="dash-stats-grid" style={{ marginTop: 20 }}>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><Wallet size={14} /> Total Earned</div>
          <div className="dash-stat-value">{loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 90, height: 26 }} /> : formatINR(totalEarned)}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><Clock size={14} /> Pending Payout</div>
          <div className="dash-stat-value">{loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 90, height: 26 }} /> : formatINR(pendingAmount)}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><TrendingUp size={14} /> Payouts Received</div>
          <div className="dash-stat-value">{loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : payoutCycles.filter(p => p.status === 'paid').length}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><CheckCircle2 size={14} /> Pending Collabs</div>
          <div className="dash-stat-value">{loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : pendingCollabs.length}</div>
        </div>
      </div>

      {/* Pending earnings breakdown */}
      {pendingCollabs.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-header">
            <div className="dash-section-title">Earnings queued for {nextDateStr}</div>
          </div>
          <div className="dash-section-body">
            {pendingCollabs.map((collab) => (
              <div key={collab.id} className="dash-row">
                <div className="dash-row-icon"><IndianRupee size={17} /></div>
                <div>
                  <div className="dash-row-title">{collab.gigs?.title ?? 'Collaboration'}</div>
                  <div className="dash-row-meta">{collab.brand_profiles?.brand_name ?? 'Brand'} · {prettyStatus(collab.status)}</div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title" style={{ color: '#059669' }}>{formatINR(collab.influencer_payout ?? collab.agreed_amount)}</div>
                  <span className="dash-badge dash-badge-pending">Queued</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout history */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Payout history</div>
        </div>
        <div className="dash-section-body">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 56, marginBottom: 8 }} />)
          ) : payoutCycles.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Wallet size={20} /></div>
              <div className="dash-empty-title">No payouts yet</div>
              <div className="dash-empty-sub">Your first payout will arrive on the 20th after your first collab completes.</div>
            </div>
          ) : (
            payoutCycles.map((cycle) => (
              <div key={cycle.id} className="dash-row">
                <div className="dash-row-icon" style={{ background: cycle.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)', color: cycle.status === 'paid' ? '#059669' : '#ea580c' }}>
                  {cycle.status === 'paid' ? <CheckCircle2 size={17} /> : <Clock size={17} />}
                </div>
                <div>
                  <div className="dash-row-title">
                    Payout · {new Date(cycle.cycle_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="dash-row-meta">
                    Gross {formatINR(cycle.amount)} · Fee {formatINR(cycle.platform_fee)}
                    {cycle.notes && ` · ${cycle.notes}`}
                  </div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title" style={{ color: cycle.status === 'paid' ? '#059669' : '#374151' }}>
                    {cycle.status === 'paid' ? '+' : ''}{formatINR(cycle.net_amount)}
                  </div>
                  <span className={`dash-badge ${cycle.status === 'paid' ? 'dash-badge-active' : 'dash-badge-pending'}`}>
                    {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Policy note */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 18px', borderRadius: 16, background: 'rgba(29,78,216,0.04)', border: '1px solid rgba(29,78,216,0.1)', marginTop: 8 }}>
        <Info size={16} style={{ color: '#1d4ed8', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
          <strong>Payout Policy:</strong> CollabKaro releases influencer earnings once a month on the <strong>20th</strong>. All completed collabs from the previous cycle are included. A 10% platform fee is deducted from gross earnings. KYC verification is required before your first payout.
        </div>
      </div>
    </div>
  )
}
