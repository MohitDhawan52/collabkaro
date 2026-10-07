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
  if (status === 'active') return { background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.22)' }
  if (status === 'paused') return { background: 'rgba(245,158,11,0.10)', color: '#B45309', border: '1px solid rgba(245,158,11,0.22)' }
  if (status === 'completed') return { background: 'rgba(139,92,246,0.08)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.18)' }
  return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.44)', border: '1px solid rgba(255,255,255,0.09)' }
}

function collabStatusStyle(status: Collaboration['status']): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.22)' }
  if (status === 'completed') return { background: 'rgba(139,92,246,0.08)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.18)' }
  if (['cancelled', 'disputed'].includes(status)) return { background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.18)' }
  return { background: 'rgba(255,85,51,0.08)', color: '#FF5533', border: '1px solid rgba(255,85,51,0.20)' }
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16,
  marginTop: 20,
  overflow: 'hidden',
  backdropFilter: 'blur(12px)',
}

const STATS_CONFIG = [
  { color: '#FF5533', bg: 'rgba(255,85,51,0.08)',  border: 'rgba(255,85,51,0.16)'  },
  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.16)' },
  { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.16)' },
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.16)' },
]

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

      const { data: brand } = await supabase.from('brand_profiles').select('id, company_name').eq('user_id', user.id).single()
      if (!brand) { setLoading(false); return }

      setBrandName((brand as unknown as { company_name?: string }).company_name ?? null)

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
    { label: 'Active Gigs',   value: activeGigs,          icon: <Briefcase size={16} />,  sub: `${gigs.length} total` },
    { label: 'New Pitches',   value: pitches.length,       icon: <Users size={16} />,      sub: 'awaiting review' },
    { label: 'Active Collabs',value: activeCollabs,        icon: <TrendingUp size={16} />, sub: `${collabs.length} total` },
    { label: 'Total Spent',   value: formatINR(totalSpent),icon: <Wallet size={16} />,     sub: 'all time' },
  ]

  const firstName = brandName?.split(' ')[0] ?? null

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5, margin: 0 }}>
            {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.44)', marginTop: 5, margin: '5px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Here&apos;s an overview of your campaigns and collaborations.
          </p>
        </div>
        <Link href="/brand/gigs/new" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 11, background: '#FF5533', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 3px 12px rgba(255,85,51,0.28)', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
          <PlusCircle size={15} /> Post a Gig
        </Link>
      </div>

      {/* Gig fee notice */}
      <div style={{ padding: '13px 18px', borderRadius: 14, background: 'rgba(255,85,51,0.04)', border: '1.5px solid rgba(255,85,51,0.14)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,85,51,0.10)', color: '#FF5533', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 15 }}>₹</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#FF5533', fontFamily: "'Outfit', sans-serif" }}>₹49 launch offer</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.44)', marginLeft: 6, fontFamily: "'DM Sans', sans-serif" }}>— A flat platform fee per gig posted (regular price ₹250). Collaboration budgets are separate.</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 20 }}>
        {stats.map((s, i) => {
          const cfg = STATS_CONFIG[i]
          return (
            <div key={s.label} className="dash-stat-card" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${cfg.border}`, borderRadius: 16, padding: '18px 18px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: cfg.bg, pointerEvents: 'none' }} />
              <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5, lineHeight: 1 }}>
                {loading ? <span style={{ display: 'inline-block', width: 48, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} /> : s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.62)', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Your Gigs */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>Your Gigs</div>
          <Link href="/brand/gigs" style={{ fontSize: 12.5, color: '#FF5533', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {loading ? [1,2,3].map(i => <div key={i} style={{ height: 58, margin: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />) :
          gigs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>No gigs posted yet.</div>
              <Link href="/brand/gigs/new" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#FF5533', color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                <PlusCircle size={14} /> Post a Gig
              </Link>
            </div>
          ) : gigs.map((gig) => (
            <Link key={gig.id} href="/brand/gigs"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,85,51,0.08)', color: '#FF5533', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>{gig.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{gig.collab_type} · {gig.platforms?.join(', ')}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>{formatINR(gig.max_budget)}</div>
                <span style={{ ...gigStatusStyle(gig.status), fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginTop: 4, display: 'inline-block', fontFamily: "'DM Sans', sans-serif" }}>
                  {prettyStatus(gig.status)}
                </span>
              </div>
              <ArrowRight size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Pitches waiting */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>Pitches Waiting for Review</div>
          <Link href="/brand/pitches" style={{ fontSize: 12.5, color: '#FF5533', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 58, margin: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />) :
          pitches.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Inbox size={26} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', fontFamily: "'DM Sans', sans-serif" }}>No pending pitches right now.</div>
            </div>
          ) : pitches.map((pitch) => (
            <Link key={pitch.id} href="/brand/pitches"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.10)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                {pitch.influencer_profiles?.full_name?.charAt(0)?.toUpperCase() ?? 'I'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>{pitch.influencer_profiles?.full_name ?? 'Influencer'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{pitch.gigs?.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.10)', color: '#B45309', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif" }}>
                  <Clock size={10} /> Pending
                </span>
                <ArrowRight size={14} style={{ color: '#D1D5DB' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Collaborations */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>Active Collaborations</div>
          <Link href="/brand/collabs" style={{ fontSize: 12.5, color: '#FF5533', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 58, margin: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />) :
          collabs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={26} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', fontFamily: "'DM Sans', sans-serif" }}>No collaborations yet. Accept a pitch to get started.</div>
            </div>
          ) : collabs.map((collab) => (
            <Link key={collab.id} href="/brand/collabs"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(16,185,129,0.10)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{collab.influencer_profiles?.full_name ?? 'Influencer'}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>{formatINR(collab.agreed_amount)}</div>
                <span style={{ ...collabStatusStyle(collab.status), fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginTop: 4, display: 'inline-block', fontFamily: "'DM Sans', sans-serif" }}>
                  {prettyStatus(collab.status)}
                </span>
              </div>
              <ArrowRight size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
