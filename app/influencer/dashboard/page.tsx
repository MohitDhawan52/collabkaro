'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Send, Wallet, TrendingUp, Sparkles, ArrowRight, Inbox, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig, Pitch, Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function pitchStatusStyle(status: Pitch['status']): React.CSSProperties {
  if (status === 'accepted') return { background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.22)' }
  if (status === 'rejected') return { background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.18)' }
  if (status === 'withdrawn') return { background: '#F3F2EE', color: '#6B7280', border: '1px solid rgba(255,255,255,0.09)' }
  return { background: 'rgba(255,85,51,0.08)', color: '#FF5533', border: '1px solid rgba(255,85,51,0.20)' }
}

function collabStatusStyle(status: Collaboration['status']): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.22)' }
  if (status === 'completed') return { background: 'rgba(139,92,246,0.08)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.18)' }
  if (['cancelled', 'disputed'].includes(status)) return { background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.18)' }
  return { background: 'rgba(255,85,51,0.08)', color: '#FF5533', border: '1px solid rgba(255,85,51,0.20)' }
}

const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1.5px solid #EBEBEB',
  borderRadius: 16,
  marginTop: 20,
  overflow: 'hidden',
}

const STATS_CONFIG = [
  { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.16)' },
  { color: '#FF5533', bg: 'rgba(255,85,51,0.08)',  border: 'rgba(255,85,51,0.16)'  },
  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.16)' },
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.16)' },
]

export default function InfluencerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [influencerName, setInfluencerName] = useState<string | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [sponsoredGigIds, setSponsoredGigIds] = useState<Set<string>>(new Set())
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('influencer_profiles')
        .select('id, full_name, niche, instagram_followers, youtube_subscribers')
        .eq('user_id', user.id)
        .single()

      if (!profile) { setLoading(false); return }

      setInfluencerName(profile.full_name)
      const influencerId = profile.id

      const [pitchesRes, collabsRes, paymentsRes] = await Promise.all([
        supabase.from('pitches').select('*, gigs(title, max_budget, collab_type)').eq('influencer_id', influencerId).order('created_at', { ascending: false }).limit(5),
        supabase.from('collaborations').select('*, gigs(title), brand_profiles(brand_name)').eq('influencer_id', influencerId).order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('amount').eq('user_id', user.id).eq('type', 'influencer_payout').eq('status', 'paid'),
      ])

      const myPitches = (pitchesRes.data as unknown as Pitch[]) ?? []
      const myCollabs = (collabsRes.data as unknown as Collaboration[]) ?? []

      setPitches(myPitches)
      setCollabs(myCollabs)
      setTotalEarnings((paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0))

      const pitchedGigIds = new Set(myPitches.map(p => p.gig_id))
      const activeCollabGigIds = new Set(
        myCollabs.filter(c => !['completed', 'cancelled', 'disputed'].includes(c.status)).map(c => c.gig_id)
      )

      const myFollowers = Math.max(profile.instagram_followers ?? 0, profile.youtube_subscribers ?? 0)
      const myNiches: string[] = profile.niche ?? []

      const gigsQuery = supabase
        .from('gigs')
        .select('*, brand_profiles(brand_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)

      const [allGigsRes, adsRes] = await Promise.all([
        gigsQuery,
        supabase.from('gig_ads').select('gig_id').eq('status', 'active'),
      ])

      const sponsoredIds = new Set<string>(((adsRes.data ?? []) as { gig_id: string }[]).map(a => a.gig_id))
      setSponsoredGigIds(sponsoredIds)

      const open = ((allGigsRes.data as unknown as Gig[]) ?? []).filter(gig => {
        if (pitchedGigIds.has(gig.id)) return false
        if (activeCollabGigIds.has(gig.id)) return false
        const nicheMatch = !gig.niche_required?.length || gig.niche_required.some(n => myNiches.includes(n))
        const followersMatch = !gig.min_followers || myFollowers >= gig.min_followers
        return nicheMatch && followersMatch
      })

      const sponsored = open.filter(g => sponsoredIds.has(g.id))
      const regular = open.filter(g => !sponsoredIds.has(g.id))
      setGigs([...sponsored, ...regular].slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  const activePitchCount = pitches.filter((p) => p.status === 'pending').length
  const activeCollabCount = collabs.filter((c) => !['completed', 'cancelled', 'disputed'].includes(c.status)).length

  const stats = [
    { label: 'Total Earnings',  value: formatINR(totalEarnings), icon: <Wallet size={16} />,     sub: 'all payouts' },
    { label: 'Pending Pitches', value: activePitchCount,          icon: <Send size={16} />,       sub: 'awaiting response' },
    { label: 'Active Collabs',  value: activeCollabCount,          icon: <Briefcase size={16} />, sub: 'in progress' },
    { label: 'Open Gigs',       value: gigs.length,                icon: <TrendingUp size={16} />, sub: 'matching profile' },
  ]

  const firstName = influencerName?.split(' ')[0] ?? null

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5, margin: 0 }}>
          {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        </h1>
        <p style={{ fontSize: 13.5, color: '#6B7280', marginTop: 5, margin: '5px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
          Here&apos;s what&apos;s happening with your collaborations today.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {stats.map((s, i) => {
          const cfg = STATS_CONFIG[i]
          return (
            <div key={s.label} className="dash-stat-card" style={{ background: '#FFFFFF', border: `1.5px solid ${cfg.border}`, borderRadius: 16, padding: '18px 18px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: cfg.bg, pointerEvents: 'none' }} />
              <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5, lineHeight: 1 }}>
                {loading ? <span style={{ display: 'inline-block', width: 48, height: 28, borderRadius: 6, background: '#F3F2EE' }} /> : s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Gigs for you */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #F3F2EE' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>Gigs Matching Your Profile</div>
          <Link href="/influencer/gigs" style={{ fontSize: 12.5, color: '#FF5533', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
            Browse all <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {loading ? [1,2,3].map(i => <div key={i} style={{ height: 58, margin: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />) :
          gigs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Inbox size={26} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>No matching gigs right now. Check back soon!</div>
            </div>
          ) : gigs.map((gig) => {
            const isSponsored = sponsoredGigIds.has(gig.id)
            return (
              <Link key={gig.id} href={`/influencer/gigs/${gig.id}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid #F3F2EE', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: isSponsored ? 'rgba(245,158,11,0.10)' : 'rgba(255,85,51,0.08)', color: isSponsored ? '#F59E0B' : '#FF5533', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSponsored ? <Zap size={15} /> : <Sparkles size={15} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: '#111113', fontFamily: "'DM Sans', sans-serif" }}>{gig.title}</span>
                    {isSponsored && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#B45309', border: '1px solid rgba(245,158,11,0.25)', letterSpacing: 0.3 }}>AD</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                    {(gig.brand_profiles as unknown as {brand_name?: string})?.brand_name ?? 'Brand'} · {gig.collab_type}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111113', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {gig.max_budget ? formatINR(Math.floor(gig.max_budget * 0.9)) : 'Barter'}
                </div>
                <ArrowRight size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Pitches */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #F3F2EE' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>Your Recent Pitches</div>
          <Link href="/influencer/pitches" style={{ fontSize: 12.5, color: '#FF5533', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 58, margin: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />) :
          pitches.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Send size={26} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>No pitches sent yet. Browse gigs and apply!</div>
            </div>
          ) : pitches.map((pitch) => (
            <Link key={pitch.id} href="/influencer/pitches"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid #F3F2EE', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,85,51,0.08)', color: '#FF5533', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111113', fontFamily: "'DM Sans', sans-serif" }}>{pitch.gigs?.title ?? 'Gig'}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                  {pitch.gigs?.max_budget ? formatINR(Math.floor(pitch.gigs.max_budget * 0.9)) : '—'} · {pitch.gigs?.collab_type}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ ...pitchStatusStyle(pitch.status), fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, fontFamily: "'DM Sans', sans-serif" }}>
                  {prettyStatus(pitch.status)}
                </span>
                <ArrowRight size={14} style={{ color: '#D1D5DB' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Collabs */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #F3F2EE' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>Active Collaborations</div>
          <Link href="/influencer/collabs" style={{ fontSize: 12.5, color: '#FF5533', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 58, margin: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />) :
          collabs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Briefcase size={26} style={{ color: '#D1D5DB', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>No collaborations yet. Once a brand accepts your pitch, it&apos;ll appear here.</div>
            </div>
          ) : collabs.map((collab) => {
            const isActive = collab.status === 'active'
            return (
              <Link key={collab.id} href="/influencer/collabs"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid #F3F2EE', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: isActive ? 'rgba(16,185,129,0.10)' : '#F3F2EE', color: isActive ? '#059669' : '#6B6B78', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isActive ? <Zap size={15} /> : <Briefcase size={15} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111113', fontFamily: "'DM Sans', sans-serif" }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{collab.brand_profiles?.brand_name ?? 'Brand'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>{formatINR(collab.influencer_payout ?? collab.agreed_amount)}</div>
                  <span style={{ ...collabStatusStyle(collab.status), fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginTop: 4, display: 'inline-block', fontFamily: "'DM Sans', sans-serif" }}>
                    {prettyStatus(collab.status)}
                  </span>
                </div>
                <ArrowRight size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
