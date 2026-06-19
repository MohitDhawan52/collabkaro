'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Payment, Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function EarningsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [pendingCollabs, setPendingCollabs] = useState<Collaboration[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: influencer } = await supabase
        .from('influencer_profiles').select('id').eq('user_id', user.id).single()
      if (!influencer) { setLoading(false); return }

      const [paymentsRes, collabsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'influencer_payout')
          .order('created_at', { ascending: false }),
        supabase
          .from('collaborations')
          .select('*, gigs(title), brand_profiles(brand_name)')
          .eq('influencer_id', influencer.id)
          .neq('status', 'cancelled')
          .neq('status', 'disputed'),
      ])

      const paid = (paymentsRes.data ?? []).filter((p) => p.status === 'paid')
      const total = paid.reduce((sum, p) => sum + (p.amount ?? 0), 0)
      setPayments(paid as unknown as Payment[])
      setTotalEarned(total)

      const pending = ((collabsRes.data as unknown as Collaboration[]) ?? []).filter(
        (c) => c.influencer_payment_status === 'pending' && c.status !== 'completed'
      )
      setPendingCollabs(pending)
      setPendingAmount(pending.reduce((sum, c) => sum + (c.influencer_payout ?? c.agreed_amount ?? 0), 0))

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="dash-page-title">Earnings</div>
      <div className="dash-page-subtitle">Track your payouts and upcoming payments.</div>

      {/* Stat cards */}
      <div className="dash-stats-grid" style={{ marginTop: 24 }}>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><Wallet size={14} /> Total Earned</div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 90, height: 26 }} /> : formatINR(totalEarned)}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><Clock size={14} /> Pending Payout</div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 90, height: 26 }} /> : formatINR(pendingAmount)}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><TrendingUp size={14} /> Paid Collabs</div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : payments.length}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label"><CheckCircle2 size={14} /> Pending Collabs</div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : pendingCollabs.length}
          </div>
        </div>
      </div>

      {/* Pending payouts */}
      {pendingCollabs.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-header">
            <div className="dash-section-title">Upcoming payouts</div>
          </div>
          <div className="dash-section-body">
            {pendingCollabs.map((collab) => (
              <div key={collab.id} className="dash-row">
                <div className="dash-row-icon"><Clock size={17} /></div>
                <div>
                  <div className="dash-row-title">{collab.gigs?.title ?? 'Collaboration'}</div>
                  <div className="dash-row-meta">{collab.brand_profiles?.brand_name ?? 'Brand'}</div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title">{formatINR(collab.influencer_payout ?? collab.agreed_amount)}</div>
                  <span className="dash-badge dash-badge-pending">{prettyStatus(collab.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Payment history</div>
        </div>
        <div className="dash-section-body">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 56, marginBottom: 8 }} />)
          ) : payments.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Wallet size={20} /></div>
              <div className="dash-empty-title">No payments yet</div>
              <div className="dash-empty-sub">Your completed collaboration payouts will appear here.</div>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="dash-row">
                <div className="dash-row-icon"><CheckCircle2 size={17} /></div>
                <div>
                  <div className="dash-row-title">Payout received</div>
                  <div className="dash-row-meta">
                    {new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title" style={{ color: '#15803D' }}>+{formatINR(payment.amount)}</div>
                  <span className="dash-badge dash-badge-active">Paid</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
