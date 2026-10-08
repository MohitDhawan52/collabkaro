'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Briefcase, Users, Star, PlusCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function formatINR(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const CARD: React.CSSProperties = { background: '#FFFFFF', border: '1.5px solid #EBEBEB', borderRadius: 16, marginTop: 20, overflow: 'hidden' }

export default function AgencyDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ clients: 0, activeGigs: 0, activeCollabs: 0, rosterCount: 0, totalSpend: 0 })
  const [recentClients, setRecentClients] = useState<{ id: string; company_name: string; industry: string | null }[]>([])
  const [agencyId, setAgencyId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const aid = (agency as unknown as { id: string }).id
    setAgencyId(aid)

    const [clientsRes, rosterRes] = await Promise.all([
      supabase.from('agency_manual_clients').select('id, company_name, industry').eq('agency_id', aid),
      supabase.from('agency_roster').select('id').eq('agency_id', aid),
    ])

    const clients = (clientsRes.data ?? []) as { id: string; company_name: string; industry: string | null }[]
    const roster = rosterRes.data ?? []

    setStats({
      clients: clients.length,
      activeGigs: 0,
      activeCollabs: 0,
      rosterCount: roster.length,
      totalSpend: 0,
    })

    setRecentClients(clients.slice(0, 4).map(c => ({ id: c.id, company_name: c.company_name, industry: c.industry })))
    setLoading(false)
  }

  const STATS = [
    { label: 'Clients', value: stats.clients, icon: Building2, color: '#7C3AED', border: 'rgba(124,58,237,0.20)' },
    { label: 'Active Gigs', value: stats.activeGigs, icon: Briefcase, color: '#FF5533', border: 'rgba(255,85,51,0.20)' },
    { label: 'Active Collabs', value: stats.activeCollabs, icon: Users, color: '#059669', border: 'rgba(16,185,129,0.20)' },
    { label: 'Roster Size', value: stats.rosterCount, icon: Star, color: '#B45309', border: 'rgba(234,179,8,0.25)' },
  ]

  return (
    <div>
      <div className="dash-page-title">Agency Overview</div>
      <div className="dash-page-subtitle">Manage all your clients, gigs, and campaigns from one place.</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 20 }}>
        {STATS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="dash-stat-card" style={{ background: '#FFFFFF', border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={s.color} />
                </div>
                <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#111113', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total spend */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', marginTop: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={18} color="#059669" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Total Campaign Spend (completed)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', fontFamily: "'Outfit', sans-serif" }}>{loading ? '—' : formatINR(stats.totalSpend)}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/agency/reports" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
            Full Report <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
        <Link href="/agency/clients/new" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, textDecoration: 'none', transition: 'all 0.14s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'; e.currentTarget.style.background = 'rgba(124,58,237,0.03)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#fff' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={16} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111113' }}>Add Client</div>
            <div style={{ fontSize: 11.5, color: '#6B7280' }}>Link a brand account</div>
          </div>
          <ArrowRight size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
        </Link>
        <Link href="/agency/gigs/new" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, textDecoration: 'none', transition: 'all 0.14s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,85,51,0.35)'; e.currentTarget.style.background = 'rgba(255,85,51,0.03)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#fff' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,85,51,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlusCircle size={16} color="#FF5533" />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111113' }}>Post a Gig</div>
            <div style={{ fontSize: 11.5, color: '#6B7280' }}>For any client</div>
          </div>
          <ArrowRight size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
        </Link>
      </div>

      {/* Recent clients */}
      <div style={CARD}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F2EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111113' }}>Recent Clients</span>
          <Link href="/agency/clients" style={{ fontSize: 12.5, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
        </div>
        {loading ? (
          <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 48, borderRadius: 10, marginBottom: 8 }} />)}</div>
        ) : recentClients.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13.5 }}>
            No clients yet. <Link href="/agency/clients/new" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Add your first client →</Link>
          </div>
        ) : (
          <div>
            {recentClients.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < recentClients.length - 1 ? '1px solid #F3F2EE' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {c.company_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111113' }}>{c.company_name}</div>
                  {c.industry && <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{c.industry}</div>}
                </div>
                <Link href="/agency/gigs/new" style={{ marginLeft: 'auto', fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Post gig <ArrowRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
