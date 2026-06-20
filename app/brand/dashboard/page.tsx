'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Users, Wallet, TrendingUp, PlusCircle, ArrowRight, Inbox, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig, Pitch, Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function gigStatusStyle(status: Gig['status']): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }
  if (status === 'paused') return { background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.25)' }
  if (status === 'completed') return { background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', border: '1px solid rgba(29,78,216,0.2)' }
  return { background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' }
}

function collabStatusStyle(status: Collaboration['status']): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }
  if (status === 'completed') return { background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', border: '1px solid rgba(29,78,216,0.2)' }
  if (['cancelled', 'disputed'].includes(status)) return { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }
  return { background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.25)' }
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: 20, boxShadow: '0 2px 16px rgba(29,78,216,0.08)',
  backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  marginTop: 20, overflow: 'hidden',
}

const STAT_COLORS = [
  { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)' },
  { gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' },
  { gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)' },
  { gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
]

function Badge({ status, styleOverride }: { status: string, styleOverride?: React.CSSProperties }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, ...styleOverride }}>
      {prettyStatus(status)}
    </span>
  )
}

export default function BrandDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: brand } = await supabase.from('brand_profiles').select('id, brand_name').eq('user_id', user.id).single()
      if (!brand) { setLoading(false); return }

      setBrandName(brand.brand_name)

      const [gigsRes, pitchesRes, collabsRes, paymentsRes] = await Promise.all([
        supabase.from('gigs').select('*').eq('brand_id', brand.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('pitches').select('*, influencer_profiles(full_name, niche, instagram_followers), gigs(title)').eq('brand_id', brand.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('collaborations').select('*, gigs(title), influencer_profiles(full_name)').eq('brand_id', brand.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('amount').eq('user_id', user.id).in('type', ['gig_fee', 'collab_payment']).eq('status', 'paid'),
      ])

      setGigs((gigsRes.data as unknown as Gig[]) ?? [])
      setPitches((pitchesRes.data as unknown as Pitch[]) ?? [])
      setCollabs((collabsRes.data as unknown as Collaboration[]) ?? [])
      setTotalSpent((paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0))
      setLoading(false)
    }
    load()
  }, [])

  const activeGigs = gigs.filter((g) => g.status === 'active').length
  const activeCollabs = collabs.filter((c) => !['completed', 'cancelled', 'disputed'].includes(c.status)).length

  const stats = [
    { label: 'Active Gigs', value: activeGigs, icon: <Briefcase size={15} />, sub: `${gigs.length} total` },
    { label: 'New Pitches', value: pitches.length, icon: <Users size={15} />, sub: 'awaiting review' },
    { label: 'Active Collabs', value: activeCollabs, icon: <TrendingUp size={15} />, sub: `${collabs.length} total` },
    { label: 'Total Spent', value: formatINR(totalSpent), icon: <Wallet size={15} />, sub: 'all time' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -0.4 }}>
            Welcome back{brandName ? `, ${brandName}` : ''} 👋
          </div>
          <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>Here's an overview of your campaigns and collaborations.</div>
        </div>
        <Link href="/brand/gigs/new" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 4px 14px rgba(29,78,216,0.3)', marginTop: 4 }}>
          <PlusCircle size={16} /> Post a Gig
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 24 }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ borderRadius: 18, padding: '18px 20px 20px', position: 'relative', overflow: 'hidden', background: STAT_COLORS[i].gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.13)' }}>
            <div style={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginTop: 10, fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -1 }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Your Gigs */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Your Gigs</div>
          <Link href="/brand/gigs" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={13} /></Link>
        </div>
        <div>
          {loading ? [1,2,3].map(i => <div key={i} style={{ height: 60, margin: '8px 16px', borderRadius: 10, background: 'rgba(29,78,216,0.05)' }} />) :
          gigs.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No gigs posted yet.</div>
              <Link href="/brand/gigs/new" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 600, fontSize: 13 }}><PlusCircle size={14} /> Post a Gig</Link>
            </div>
          ) : gigs.map((gig) => (
            <Link key={gig.id} href="/brand/gigs" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,78,216,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(29,78,216,0.08)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Briefcase size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0c1445' }}>{gig.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{gig.collab_type} · {gig.platforms?.join(', ')}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445' }}>{formatINR(gig.max_budget)}</div>
                <span style={{ ...gigStatusStyle(gig.status), fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginTop: 4, display: 'inline-block' }}>{prettyStatus(gig.status)}</span>
              </div>
              <ArrowRight size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Pitches waiting */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Pitches Waiting for Review</div>
          <Link href="/brand/pitches" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={13} /></Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 60, margin: '8px 16px', borderRadius: 10, background: 'rgba(29,78,216,0.05)' }} />) :
          pitches.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Inbox size={24} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No pending pitches right now.</div>
            </div>
          ) : pitches.map((pitch) => (
            <Link key={pitch.id} href="/brand/pitches" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,78,216,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {pitch.influencer_profiles?.full_name?.charAt(0)?.toUpperCase() ?? 'I'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0c1445' }}>{pitch.influencer_profiles?.full_name ?? 'Influencer'}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{pitch.gigs?.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={10} /> Pending
                </span>
                <ArrowRight size={14} style={{ color: '#9ca3af' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Collaborations */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Active Collaborations</div>
          <Link href="/brand/collabs" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={13} /></Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 60, margin: '8px 16px', borderRadius: 10, background: 'rgba(29,78,216,0.05)' }} />) :
          collabs.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={24} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No collaborations yet. Accept a pitch to get started.</div>
            </div>
          ) : collabs.map((collab) => (
            <Link key={collab.id} href="/brand/collabs" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,78,216,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle2 size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0c1445' }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{collab.influencer_profiles?.full_name ?? 'Influencer'}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445' }}>{formatINR(collab.agreed_amount)}</div>
                <span style={{ ...collabStatusStyle(collab.status), fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginTop: 4, display: 'inline-block' }}>{prettyStatus(collab.status)}</span>
              </div>
              <ArrowRight size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
