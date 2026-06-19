'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, IndianRupee, Users, Briefcase, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface PaymentRow {
  id: string
  user_id: string
  type: string
  amount: number
  status: string
  created_at: string
  email?: string
  razorpay_payment_id: string | null
}

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyType(type: string) {
  switch (type) {
    case 'gig_fee': return 'Gig Fee'
    case 'collab_payment': return 'Collab Payment'
    case 'influencer_payout': return 'Influencer Payout'
    case 'refund': return 'Refund'
    default: return type
  }
}

function badgeClass(status: string) {
  switch (status) {
    case 'paid': return 'dash-badge dash-badge-active'
    case 'failed': return 'dash-badge dash-badge-rejected'
    case 'refunded': return 'dash-badge dash-badge-neutral'
    default: return 'dash-badge dash-badge-pending'
  }
}

function typeColor(type: string) {
  switch (type) {
    case 'gig_fee': return { bg: '#FEF3C7', color: '#B45309' }
    case 'collab_payment': return { bg: 'rgba(109,40,217,0.08)', color: 'var(--brand-primary)' }
    case 'influencer_payout': return { bg: '#DCFCE7', color: '#15803D' }
    case 'refund': return { bg: '#FEE2E2', color: '#DC2626' }
    default: return { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  }
}

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [filter, setFilter] = useState('all')

  // Platform earnings breakdown
  const gigFees = payments.filter((p) => p.type === 'gig_fee' && p.status === 'paid')
  const collabPayments = payments.filter((p) => p.type === 'collab_payment' && p.status === 'paid')
  const influencerPayouts = payments.filter((p) => p.type === 'influencer_payout' && p.status === 'paid')
  const refunds = payments.filter((p) => p.type === 'refund')

  const totalGigFeeRevenue = gigFees.reduce((s, p) => s + p.amount, 0)
  const totalCollabVolume = collabPayments.reduce((s, p) => s + p.amount, 0)
  const totalPayoutsReleased = influencerPayouts.reduce((s, p) => s + p.amount, 0)
  const platformCommission = totalCollabVolume * 0.10
  const totalRevenue = totalGigFeeRevenue + platformCommission

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const [paymentsRes, profilesRes] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email'),
      ])

      const emailMap: Record<string, string> = {}
      for (const p of profilesRes.data ?? []) emailMap[p.id] = p.email

      const rows = (paymentsRes.data ?? []).map((p) => ({
        ...p,
        email: emailMap[p.user_id] ?? '—',
      }))

      setPayments(rows as PaymentRow[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.type === filter)

  return (
    <div>
      <div className="dash-page-title">Payments & Revenue</div>
      <div className="dash-page-subtitle">Complete financial overview of the platform.</div>

      {/* Revenue cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 24 }}>
        {/* Total Platform Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
          borderRadius: 20, padding: '22px 24px', boxShadow: '0 8px 24px rgba(109,40,217,0.3)',
          gridColumn: 'span 2',
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} /> Total Platform Revenue
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginTop: 8, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {loading ? '...' : formatINR(totalRevenue)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
            Gig fees + 10% commission on collaborations
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label"><Briefcase size={14} /> Gig Fee Revenue</div>
          <div className="dash-stat-value">{loading ? '...' : formatINR(totalGigFeeRevenue)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>₹250 × {gigFees.length} gigs</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label"><IndianRupee size={14} /> Commission Earned</div>
          <div className="dash-stat-value">{loading ? '...' : formatINR(platformCommission)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>10% of {formatINR(totalCollabVolume)} volume</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label"><Users size={14} /> Payouts Released</div>
          <div className="dash-stat-value">{loading ? '...' : formatINR(totalPayoutsReleased)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{influencerPayouts.length} influencer payouts</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label"><Wallet size={14} /> Total Collab Volume</div>
          <div className="dash-stat-value">{loading ? '...' : formatINR(totalCollabVolume)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{collabPayments.length} collaborations paid</div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20,
        padding: '20px 24px', boxShadow: 'var(--shadow-card)', marginTop: 20,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Revenue Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Gig listing fees (₹250/gig)', amount: totalGigFeeRevenue, count: gigFees.length, color: '#B45309' },
            { label: '10% platform commission', amount: platformCommission, count: collabPayments.length, color: 'var(--brand-primary)' },
            { label: 'Refunds issued', amount: refunds.reduce((s, p) => s + p.amount, 0), count: refunds.length, color: '#DC2626' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{row.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.count} transactions</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: row.color }}>{formatINR(row.amount)}</div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Net Platform Earnings</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand-primary)' }}>{formatINR(totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="dash-section" style={{ marginTop: 20 }}>
        <div className="dash-section-header">
          <div className="dash-section-title">Transaction History</div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input" style={{ fontSize: 12, padding: '5px 10px', width: 160 }}>
            <option value="all">All Types</option>
            <option value="gig_fee">Gig Fees</option>
            <option value="collab_payment">Collab Payments</option>
            <option value="influencer_payout">Influencer Payouts</option>
            <option value="refund">Refunds</option>
          </select>
        </div>
        <div className="dash-section-body">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 56, marginBottom: 8 }} />)
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Wallet size={20} /></div>
              <div className="dash-empty-title">No transactions yet</div>
            </div>
          ) : (
            filtered.map((payment) => {
              const tc = typeColor(payment.type)
              return (
                <div key={payment.id} className="dash-row">
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: tc.bg, color: tc.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowUpRight size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dash-row-title">{prettyType(payment.type)}</div>
                    <div className="dash-row-meta">
                      {payment.email} · {new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {payment.razorpay_payment_id && ` · ${payment.razorpay_payment_id}`}
                    </div>
                  </div>
                  <div className="dash-row-right">
                    <div className="dash-row-title">{formatINR(payment.amount)}</div>
                    <span className={badgeClass(payment.status)}>{payment.status}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
