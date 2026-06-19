'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Clock, TrendingUp, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Stats {
  totalBrands: number; totalInfluencers: number
  pendingBrands: number; pendingInfluencers: number
  totalGigs: number; activeGigs: number; totalCollabs: number
}
interface PendingUser { id: string; email: string; role: string; created_at: string; name: string }

const GLASS_CARD: React.CSSProperties = {
  borderRadius: 18, padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)', background: 'rgba(255,255,255,0.55)',
  boxShadow: '0 2px 20px rgba(29,78,216,0.09)',
}

const SECTION_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: 20, boxShadow: '0 2px 16px rgba(29,78,216,0.08)',
  backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  marginTop: 22, overflow: 'hidden',
}

const STAT_COLORS = [
  { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)', num: '#fff', sub: 'rgba(255,255,255,0.75)', label: 'rgba(255,255,255,0.85)' },
  { gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', num: '#fff', sub: 'rgba(255,255,255,0.75)', label: 'rgba(255,255,255,0.85)' },
  { gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)', num: '#fff', sub: 'rgba(255,255,255,0.75)', label: 'rgba(255,255,255,0.85)' },
  { gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', num: '#fff', sub: 'rgba(255,255,255,0.75)', label: 'rgba(255,255,255,0.85)' },
]

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalBrands: 0, totalInfluencers: 0, pendingBrands: 0, pendingInfluencers: 0, totalGigs: 0, activeGigs: 0, totalCollabs: 0 })
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const [profilesRes, gigsRes, collabsRes, brandsRes, influencersRes] = await Promise.all([
      supabase.from('profiles').select('id, email, role, status, created_at'),
      supabase.from('gigs').select('id, status'),
      supabase.from('collaborations').select('id'),
      supabase.from('brand_profiles').select('user_id, brand_name'),
      supabase.from('influencer_profiles').select('user_id, full_name'),
    ])
    const profiles = profilesRes.data ?? []
    const brandMap: Record<string, string> = {}
    const influencerMap: Record<string, string> = {}
    for (const b of brandsRes.data ?? []) brandMap[b.user_id] = b.brand_name
    for (const i of influencersRes.data ?? []) influencerMap[i.user_id] = i.full_name
    const pending = profiles.filter((p) => p.status === 'pending').map((p) => ({
      id: p.id, email: p.email, role: p.role, created_at: p.created_at,
      name: p.role === 'brand' ? (brandMap[p.id] ?? p.email) : (influencerMap[p.id] ?? p.email),
    }))
    const gigs = gigsRes.data ?? []
    setStats({ totalBrands: profiles.filter(p => p.role === 'brand').length, totalInfluencers: profiles.filter(p => p.role === 'influencer').length, pendingBrands: profiles.filter(p => p.role === 'brand' && p.status === 'pending').length, pendingInfluencers: profiles.filter(p => p.role === 'influencer' && p.status === 'pending').length, totalGigs: gigs.length, activeGigs: gigs.filter(g => g.status === 'active').length, totalCollabs: (collabsRes.data ?? []).length })
    setPendingUsers(pending)
    setLoading(false)
  }

  async function handleAction(userId: string, action: 'approved' | 'rejected') {
    setActing(userId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ status: action }).eq('id', userId)
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      setStats(prev => {
        const user = pendingUsers.find(u => u.id === userId)
        if (!user) return prev
        return { ...prev, pendingBrands: user.role === 'brand' ? prev.pendingBrands - 1 : prev.pendingBrands, pendingInfluencers: user.role === 'influencer' ? prev.pendingInfluencers - 1 : prev.pendingInfluencers }
      })
    }
    setActing(null)
  }

  const statCards = [
    { label: 'Total Brands',       value: stats.totalBrands,       icon: <Briefcase size={15} />,   sub: `${stats.pendingBrands} pending` },
    { label: 'Total Influencers',  value: stats.totalInfluencers,  icon: <Users size={15} />,       sub: `${stats.pendingInfluencers} pending` },
    { label: 'Active Gigs',        value: stats.activeGigs,        icon: <TrendingUp size={15} />,  sub: `${stats.totalGigs} total` },
    { label: 'Collaborations',     value: stats.totalCollabs,      icon: <CheckCircle2 size={15} />, sub: 'all time' },
  ]

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -0.4 }}>Admin Overview</div>
      <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4, marginBottom: 24 }}>Manage users, approve accounts, and monitor platform activity.</div>

      {/* Glass stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {statCards.map((card, i) => (
          <div key={card.label} style={{ borderRadius: 18, padding: '18px 20px 20px', position: 'relative', overflow: 'hidden', background: STAT_COLORS[i].gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: STAT_COLORS[i].label, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: STAT_COLORS[i].num, marginTop: 10, fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -1 }}>
              {loading ? '—' : card.value}
            </div>
            <div style={{ fontSize: 11.5, color: STAT_COLORS[i].sub, marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        {[
          { href: '/admin/brands', label: 'Manage Brands', sub: stats.pendingBrands > 0 ? `${stats.pendingBrands} waiting for approval` : 'All caught up', color: '#f97316' },
          { href: '/admin/influencers', label: 'Manage Influencers', sub: stats.pendingInfluencers > 0 ? `${stats.pendingInfluencers} waiting for approval` : 'All caught up', color: '#a855f7' },
        ].map(link => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <div style={{ ...GLASS_CARD, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445' }}>{link.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{link.sub}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${link.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={16} style={{ color: link.color }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending approvals */}
      <div style={SECTION_CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', display: 'flex', alignItems: 'center', gap: 10 }}>
            Pending Approvals
            {pendingUsers.length > 0 && (
              <span style={{ background: 'rgba(249,115,22,0.15)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.3)', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock size={10} /> {pendingUsers.length}
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 60, background: 'rgba(29,78,216,0.06)', borderRadius: 10, marginBottom: 8 }} />)
          ) : pendingUsers.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: 12 }}>
                <CheckCircle2 size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>All caught up!</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>No pending approvals right now.</div>
            </div>
          ) : (
            pendingUsers.map((user) => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 10px', borderRadius: 14, marginBottom: 4, background: 'rgba(255,255,255,0.4)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: user.role === 'brand' ? 'rgba(249,115,22,0.15)' : 'rgba(168,85,247,0.15)', color: user.role === 'brand' ? '#f97316' : '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0c1445' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {user.email} · <span style={{ textTransform: 'capitalize', color: user.role === 'brand' ? '#f97316' : '#a855f7', fontWeight: 600 }}>{user.role}</span> · {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleAction(user.id, 'rejected')} disabled={acting === user.id}
                    style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <XCircle size={13} /> Reject
                  </button>
                  <button onClick={() => handleAction(user.id, 'approved')} disabled={acting === user.id}
                    style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                    <CheckCircle2 size={13} /> Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
