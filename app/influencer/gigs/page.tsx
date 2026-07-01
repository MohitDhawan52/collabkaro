'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Search, Sparkles, IndianRupee, Send, X, Inbox, Megaphone, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig } from '@/types/index'
import { NICHES, PLATFORMS } from '@/types/index'

// Fire-and-forget ad event tracker — never blocks UI
async function trackAdEvent(ad_id: string, event_type: 'impression' | 'pitch_click', viewer_user_id: string) {
  try {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id, event_type, viewer_user_id }),
    })
  } catch { /* silent */ }
}

function formatINR(amount: number | null | undefined) {
  if (amount == null) return 'Open to negotiate'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatNumber(n: number | null | undefined) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function BadgeCheckSvg({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="#1d4ed8" />
      <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BrowseGigsPage() {
  const [loading, setLoading] = useState(true)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [sponsoredGigIds, setSponsoredGigIds] = useState<Set<string>>(new Set())
  const [gigToAdId, setGigToAdId] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [search, setSearch] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [pitchedGigIds, setPitchedGigIds] = useState<Set<string>>(new Set())

  const [pitchGig, setPitchGig] = useState<Gig | null>(null)
  const [pitchMessage, setPitchMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('influencer-gig-ads-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gig_ads' }, () => { load() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gig_ads' }, (payload) => {
        const updated = payload.new as { id: string; gig_id: string; status: string }
        if (updated.status === 'active') {
          setSponsoredGigIds(prev => new Set([...prev, updated.gig_id]))
          setGigToAdId(prev => ({ ...prev, [updated.gig_id]: updated.id }))
        } else {
          setSponsoredGigIds(prev => { const s = new Set(prev); s.delete(updated.gig_id); return s })
          setGigToAdId(prev => { const m = { ...prev }; delete m[updated.gig_id]; return m })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [gigsRes, influencerRes, adsRes] = await Promise.all([
      supabase
        .from('gigs')
        .select('*, brand_profiles(brand_name, industry, location), collaborations(id)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('influencer_profiles')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('gig_ads')
        .select('id, gig_id')
        .eq('status', 'active'),
    ])

    setCurrentUserId(user.id)

    const verified = influencerRes.data?.is_verified ?? false
    setIsVerified(verified)

    const adsData = (adsRes.data ?? []) as { gig_id: string; id: string }[]
    const sponsoredIds = new Set<string>(adsData.map(a => a.gig_id))
    setSponsoredGigIds(sponsoredIds)
    const adMap: Record<string, string> = {}
    adsData.forEach(a => { adMap[a.gig_id] = a.id })
    setGigToAdId(adMap)

    // 4-hour verified priority: hide gigs posted < 4h ago for non-verified
    const now = Date.now()
    const fourHours = 4 * 60 * 60 * 1000
    const rawGigs = (gigsRes.data as unknown as (Gig & { collaborations?: { id: string }[]; influencer_limit?: number | null })[]) ?? []
    // Hide gigs that have reached their influencer limit
    const openGigs = rawGigs.filter(g => {
      if (!g.influencer_limit) return true
      return (g.collaborations ?? []).length < g.influencer_limit
    })
    const allGigs = openGigs
    const visibleGigs = verified
      ? allGigs
      : allGigs.filter(g => (now - new Date(g.created_at).getTime()) >= fourHours)

    setGigs(visibleGigs)

    if (influencerRes.data) {
      const { data: pitches } = await supabase
        .from('pitches')
        .select('gig_id')
        .eq('influencer_id', influencerRes.data.id)
      setPitchedGigIds(new Set((pitches ?? []).map((p) => p.gig_id)))
    }

    // Fire impression events for all sponsored gigs visible to this user
    adsData.forEach(a => {
      trackAdEvent(a.id, 'impression', user.id)
    })

    setLoading(false)
  }

  async function submitPitch() {
    if (!pitchGig) return
    if (!pitchMessage.trim()) { toast.error('Please write a message to the brand'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setSubmitting(false); return }
    const { data: influencer } = await supabase
      .from('influencer_profiles').select('id').eq('user_id', user.id).single()
    if (!influencer) { toast.error('Profile not found'); setSubmitting(false); return }
    const { error } = await supabase.from('pitches').insert({
      gig_id: pitchGig.id,
      brand_id: pitchGig.brand_id,
      influencer_id: influencer.id,
      message: pitchMessage.trim(),
      status: 'pending',
    })
    if (error) {
      toast.error('Could not submit pitch')
    } else {
      toast.success('Pitch sent! The brand will review it soon.')
      setPitchedGigIds((prev) => new Set([...prev, pitchGig.id]))
      // Track pitch click on sponsored gig
      const adId = gigToAdId[pitchGig.id]
      if (adId && currentUserId) trackAdEvent(adId, 'pitch_click', currentUserId)
      setPitchGig(null)
      setPitchMessage('')
    }
    setSubmitting(false)
  }

  const filtered = gigs.filter((g) => {
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.brand_profiles?.brand_name?.toLowerCase().includes(search.toLowerCase())
    const matchNiche = !nicheFilter || (g.niche_required ?? []).includes(nicheFilter)
    const matchPlatform = !platformFilter || (g.platforms ?? []).includes(platformFilter)
    return matchSearch && matchNiche && matchPlatform
  })

  // Sponsored at top, rest below
  const sponsoredFiltered = filtered.filter(g => sponsoredGigIds.has(g.id))
  const regularFiltered = filtered.filter(g => !sponsoredGigIds.has(g.id))
  const orderedFiltered = [...sponsoredFiltered, ...regularFiltered]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="dash-page-title">Browse Gigs</div>
          <div className="dash-page-subtitle">Find brand campaigns that match your niche and apply with a pitch.</div>
        </div>
        {isVerified && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#eff6ff', border: '1.5px solid #bfdbfe', fontSize: 12.5, fontWeight: 700, color: '#1d4ed8', marginLeft: 'auto' }}>
            <BadgeCheckSvg size={14} /> Verified — Early Access Active
          </span>
        )}
      </div>

      {/* Verified-only banner */}
      {!isVerified && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #bfdbfe' }}>
          <Lock size={16} style={{ color: '#1d4ed8', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: '#1e40af' }}>
            <strong>Verified creators get 4-hour early access</strong> to every new gig before it goes public.{' '}
            <a href="/influencer/verification" style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}>Get verified →</a>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: 36 }} placeholder="Search gigs or brands..." />
        </div>
        <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} className="input" style={{ width: 160 }}>
          <option value="">All Niches</option>
          {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="input" style={{ width: 160 }}>
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
        {loading ? 'Loading...' : `${orderedFiltered.length} gig${orderedFiltered.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Gig cards */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 140, borderRadius: 18 }} />)
        ) : orderedFiltered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Inbox size={20} /></div>
              <div className="dash-empty-title">No gigs found</div>
              <div className="dash-empty-sub">Try changing your filters or check back soon for new campaigns.</div>
            </div>
          </div>
        ) : (
          orderedFiltered.map((gig) => {
            const alreadyPitched = pitchedGigIds.has(gig.id)
            const isSponsored = sponsoredGigIds.has(gig.id)
            return (
              <div key={gig.id} style={{
                background: isSponsored ? 'linear-gradient(135deg,#fffbeb,#fff)' : 'var(--bg-card)',
                border: isSponsored ? '1.5px solid #fde68a' : '1px solid var(--bg-border)',
                borderRadius: 18, padding: '20px 22px', boxShadow: isSponsored ? '0 4px 20px rgba(245,158,11,0.12)' : 'var(--shadow-card)',
              }}>
                {isSponsored && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>
                    <Megaphone size={12} style={{ color: '#f59e0b' }} /> SPONSORED
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div className="dash-row-icon" style={{ marginTop: 2 }}><Sparkles size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div className="dash-row-title" style={{ fontSize: 15 }}>{gig.title}</div>
                      <span className="badge badge-gray">{gig.collab_type}</span>
                    </div>
                    <div className="dash-row-meta" style={{ marginTop: 3 }}>
                      {gig.brand_profiles?.brand_name ?? 'Brand'}
                      {gig.brand_profiles?.location && ` · ${gig.brand_profiles.location}`}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                      {gig.description?.slice(0, 160)}{(gig.description?.length ?? 0) > 160 ? '...' : ''}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {(gig.niche_required ?? []).map((n) => <span key={n} className="badge badge-purple">{n}</span>)}
                      {(gig.platforms ?? []).map((p) => <span key={p} className="badge badge-gray">{p}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                      <IndianRupee size={14} />
                      {gig.max_budget ? formatINR(Math.floor(gig.max_budget * 0.9)) : 'Barter'}
                    </div>
                    {gig.max_budget && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, textAlign: 'right' }}>you earn</div>
                    )}
                    {gig.min_followers && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Min {formatNumber(gig.min_followers)} followers
                      </div>
                    )}
                    {(gig as Gig & { influencer_limit?: number | null; collaborations?: { id: string }[] }).influencer_limit && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginTop: 2 }}>
                        {(() => {
                          const limit = (gig as Gig & { influencer_limit?: number | null; collaborations?: { id: string }[] }).influencer_limit!
                          const taken = ((gig as Gig & { collaborations?: { id: string }[] }).collaborations ?? []).length
                          const left = limit - taken
                          return `${left} of ${limit} slot${limit !== 1 ? 's' : ''} left`
                        })()}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      <a href={`/influencer/gigs/${gig.id}`} style={{ display: 'block', textAlign: 'center', fontSize: 13, padding: '7px 18px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, textDecoration: 'none' }}>
                        View Details
                      </a>
                      <button
                        onClick={() => { if (!alreadyPitched) { setPitchGig(gig); setPitchMessage('') } }}
                        disabled={alreadyPitched}
                        className={alreadyPitched ? 'btn btn-secondary' : 'btn btn-primary'}
                        style={{ fontSize: 13, padding: '8px 18px', opacity: alreadyPitched ? 0.6 : 1 }}
                      >
                        {alreadyPitched ? '✓ Pitched' : <><Send size={13} /> Pitch</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pitch Modal */}
      {pitchGig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Send a Pitch</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{pitchGig.title}</div>
              </div>
              <button onClick={() => setPitchGig(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                Your message to the brand *
              </label>
              <textarea
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                className="input"
                rows={5}
                placeholder="Introduce yourself, explain why you're a great fit for this campaign, and mention your audience stats..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPitchGig(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={submitPitch} disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                {submitting ? 'Sending...' : <><Send size={14} /> Send Pitch</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
