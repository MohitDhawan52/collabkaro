'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Briefcase, GitMerge, Send, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBrands: 0, approvedBrands: 0,
    totalInfluencers: 0, approvedInfluencers: 0,
    totalGigs: 0, activeGigs: 0,
    totalPitches: 0, acceptedPitches: 0,
    totalCollabs: 0, completedCollabs: 0, disputedCollabs: 0,
    totalRevenue: 0, totalPayouts: 0,
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()

      const [profilesRes, gigsRes, pitchesRes, collabsRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('role, status'),
        supabase.from('gigs').select('status'),
        supabase.from('pitches').select('status'),
        supabase.from('collaborations').select('status'),
        supabase.from('payments').select('type, amount, status'),
      ])

      const profiles = profilesRes.data ?? []
      const gigs = gigsRes.data ?? []
      const pitches = pitchesRes.data ?? []
      const collabs = collabsRes.data ?? []
      const payments = paymentsRes.data ?? []

      const paidPayments = payments.filter((p) => p.status === 'paid')
      const gigFeeRevenue = paidPayments.filter((p) => p.type === 'gig_fee').reduce((s, p) => s + p.amount, 0)
      const collabVolume = paidPayments.filter((p) => p.type === 'collab_payment').reduce((s, p) => s + p.amount, 0)
      const payouts = paidPayments.filter((p) => p.type === 'influencer_payout').reduce((s, p) => s + p.amount, 0)

      setStats({
        totalBrands: profiles.filter((p) => p.role === 'brand').length,
        approvedBrands: profiles.filter((p) => p.role === 'brand' && p.status === 'approved').length,
        totalInfluencers: profiles.filter((p) => p.role === 'influencer').length,
        approvedInfluencers: profiles.filter((p) => p.role === 'influencer' && p.status === 'approved').length,
        totalGigs: gigs.length,
        activeGigs: gigs.filter((g) => g.status === 'active').length,
        totalPitches: pitches.length,
        acceptedPitches: pitches.filter((p) => p.status === 'accepted').length,
        totalCollabs: collabs.length,
        completedCollabs: collabs.filter((c) => c.status === 'completed').length,
        disputedCollabs: collabs.filter((c) => c.status === 'disputed').length,
        totalRevenue: gigFeeRevenue + (collabVolume * 0.10),
        totalPayouts: payouts,
      })
      setLoading(false)
    }
    load()
  }, [])

  const statGroups = [
    {
      title: 'Users',
      icon: <Users size={16} />,
      color: 'var(--brand-primary)',
      items: [
        { label: 'Total Brands', value: stats.totalBrands },
        { label: 'Approved Brands', value: stats.approvedBrands },
        { label: 'Total Influencers', value: stats.totalInfluencers },
        { label: 'Approved Influencers', value: stats.approvedInfluencers },
      ]
    },
    {
      title: 'Gigs',
      icon: <Briefcase size={16} />,
      color: '#B45309',
      items: [
        { label: 'Total Gigs Posted', value: stats.totalGigs },
        { label: 'Active Gigs', value: stats.activeGigs },
        { label: 'Total Pitches Sent', value: stats.totalPitches },
        { label: 'Pitches Accepted', value: stats.acceptedPitches },
      ]
    },
    {
      title: 'Collaborations',
      icon: <GitMerge size={16} />,
      color: '#0369A1',
      items: [
        { label: 'Total Collaborations', value: stats.totalCollabs },
        { label: 'Completed', value: stats.completedCollabs },
        { label: 'Disputed', value: stats.disputedCollabs },
        { label: 'Conversion Rate', value: stats.totalPitches > 0 ? `${Math.round((stats.acceptedPitches / stats.totalPitches) * 100)}%` : '0%' },
      ]
    },
    {
      title: 'Revenue',
      icon: <TrendingUp size={16} />,
      color: '#15803D',
      items: [
        { label: 'Platform Earnings', value: formatINR(stats.totalRevenue) },
        { label: 'Total Payouts', value: formatINR(stats.totalPayouts) },
        { label: 'Avg Pitch Accept Rate', value: stats.totalPitches > 0 ? `${Math.round((stats.acceptedPitches / stats.totalPitches) * 100)}%` : '0%' },
        { label: 'Completed Collabs', value: stats.completedCollabs },
      ]
    },
  ]

  return (
    <div>
      <div className="dash-page-title">Platform Stats</div>
      <div className="dash-page-subtitle">Full analytics overview of CollabKaro.</div>

      {/* Key metrics */}
      <div className="dash-stats-grid" style={{ marginTop: 24 }}>
        {[
          { icon: <Users size={14} />, label: 'Total Users', value: stats.totalBrands + stats.totalInfluencers },
          { icon: <Send size={14} />, label: 'Total Pitches', value: stats.totalPitches },
          { icon: <CheckCircle2 size={14} />, label: 'Completed Collabs', value: stats.completedCollabs },
          { icon: <TrendingUp size={14} />, label: 'Platform Revenue', value: formatINR(stats.totalRevenue) },
        ].map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-label">{s.icon} {s.label}</div>
            <div className="dash-stat-value">
              {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 60, height: 26 }} /> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed groups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        {statGroups.map((group) => (
          <div key={group.title} style={{
            background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
            borderRadius: 20, padding: '20px 22px', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: group.color, fontWeight: 700, fontSize: 14 }}>
              {group.icon} {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 16 }} /> : item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
