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
  if (status === 'accepted') return { background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }
  if (status === 'rejected') return { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }
  if (status === 'withdrawn') return { background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' }
  return { background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.25)' }
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
  { gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
  { gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' },
  { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)' },
  { gradient: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)' },
]

export default function InfluencerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [influencerName, setInfluencerName] = useState<string | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
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

      // Gigs the influencer already pitched on or has an active collab
      const pitchedGigIds = new Set(myPitches.map(p => p.gig_id))
      const activeCollabGigIds = new Set(
        myCollabs.filter(c => !['completed', 'cancelled', 'disputed'].includes(c.status)).map(c => c.gig_id)
      )

      // Fetch gigs matching this influencer's niche & followers criteria
      const myFollowers = Math.max(profile.instagram_followers ?? 0, profile.youtube_subscribers ?? 0)
      const myNiches: string[] = profile.niche ?? []

      let gigsQuery = supabase
        .from('gigs')
        .select('*, brand_profiles(brand_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: allGigs } = await gigsQuery

      // Client-side filter: niche overlap + min_followers check + not already applied/active
      const filtered = ((allGigs as unknown as Gig[]) ?? []).filter(gig => {
        if (pitchedGigIds.has(gig.id)) return false      // already pitched
        if (activeCollabGigIds.has(gig.id)) return false  // already in active collab
        // Niche match — show if gig requires no niche OR influencer matches at least one
        const nicheMatch = !gig.niche_required?.length || gig.niche_required.some(n => myNiches.includes(n))
        // Followers match — show if no min set OR influencer meets it
        const followersMatch = !gig.min_followers || myFollowers >= gig.min_followers
        return nicheMatch && followersMatch
      }).slice(0, 5)

      setGigs(filtered)
      setLoading(false)
    }
    load()
  }, [])

  const activePitchCount = pitches.filter((p) => p.status === 'pending').length
  const activeCollabCount = collabs.filter((c) => !['completed', 'cancelled', 'disputed'].includes(c.status)).length

  const stats = [
    { label: 'Total Earnings', value: formatINR(totalEarnings), icon: <Wallet size={15} />, sub: 'all payouts' },
    { label: 'Pending Pitches', value: activePitchCount, icon: <Send size={15} />, sub: 'awaiting response' },
    { label: 'Active Collabs', value: activeCollabCount, icon: <Briefcase size={15} />, sub: 'in progress' },
    { label: 'Open Gigs', value: gigs.length, icon: <TrendingUp size={15} />, sub: 'matching your profile' },
  ]

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -0.4 }}>
        Welcome back{influencerName ? `, ${influencerName}` : ''} 👋
      </div>
      <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>Here's what's happening with your collaborations today.</div>

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

      {/* Gigs for you */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Gigs Matching Your Profile</div>
          <Link href="/influencer/gigs" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Browse all <ArrowRight size={13} /></Link>
        </div>
        <div>
          {loading ? [1,2,3].map(i => <div key={i} style={{ height: 60, margin: '8px 16px', borderRadius: 10, background: 'rgba(29,78,216,0.05)' }} />) :
          gigs.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Inbox size={24} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No matching gigs right now. Check back soon!</div>
            </div>
          ) : gigs.map((gig) => (
            <Link key={gig.id} href={`/influencer/gigs/${gig.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,78,216,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0c1445' }}>{gig.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{(gig.brand_profiles as unknown as {brand_name?: string})?.brand_name ?? 'Brand'} · {gig.collab_type}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445' }}>{formatINR(gig.max_budget)}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>budget</div>
              </div>
              <ArrowRight size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Pitches — clickable */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Your Recent Pitches</div>
          <Link href="/influencer/pitches" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={13} /></Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 60, margin: '8px 16px', borderRadius: 10, background: 'rgba(29,78,216,0.05)' }} />) :
          pitches.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Send size={24} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No pitches sent yet. Browse gigs and apply!</div>
            </div>
          ) : pitches.map((pitch) => (
            <Link key={pitch.id} href="/influencer/pitches" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,78,216,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0c1445' }}>{pitch.gigs?.title ?? 'Gig'}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{formatINR(pitch.gigs?.max_budget)} · {pitch.gigs?.collab_type}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ ...pitchStatusStyle(pitch.status), fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{prettyStatus(pitch.status)}</span>
                <ArrowRight size={14} style={{ color: '#9ca3af' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Collabs — clickable */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Active Collaborations</div>
          <Link href="/influencer/collabs" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={13} /></Link>
        </div>
        <div>
          {loading ? [1,2].map(i => <div key={i} style={{ height: 60, margin: '8px 16px', borderRadius: 10, background: 'rgba(29,78,216,0.05)' }} />) :
          collabs.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Briefcase size={24} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No collaborations yet. Once a brand accepts your pitch, it'll appear here.</div>
            </div>
          ) : collabs.map((collab) => {
            const isActive = collab.status === 'active'
            return (
              <Link key={collab.id} href="/influencer/collabs" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', background: isActive ? 'rgba(16,185,129,0.04)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,78,216,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = isActive ? 'rgba(16,185,129,0.04)' : 'transparent')}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(29,78,216,0.08)', color: isActive ? '#059669' : '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isActive ? <Zap size={16} /> : <Briefcase size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0c1445' }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{collab.brand_profiles?.brand_name ?? 'Brand'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445' }}>{formatINR(collab.influencer_payout ?? collab.agreed_amount)}</div>
                  <span style={{ ...collabStatusStyle(collab.status), fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginTop: 4, display: 'inline-block' }}>{prettyStatus(collab.status)}</span>
                </div>
                <ArrowRight size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
