'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Search, Sparkles, IndianRupee, Send, X, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig } from '@/types/index'
import { NICHES, PLATFORMS } from '@/types/index'

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

export default function BrowseGigsPage() {
  const [loading, setLoading] = useState(true)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [search, setSearch] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [pitchedGigIds, setPitchedGigIds] = useState<Set<string>>(new Set())

  // Pitch modal state
  const [pitchGig, setPitchGig] = useState<Gig | null>(null)
  const [pitchMessage, setPitchMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [gigsRes, influencerRes] = await Promise.all([
      supabase
        .from('gigs')
        .select('*, brand_profiles(brand_name, industry, location)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single(),
    ])

    setGigs((gigsRes.data as unknown as Gig[]) ?? [])

    if (influencerRes.data) {
      const { data: pitches } = await supabase
        .from('pitches')
        .select('gig_id')
        .eq('influencer_id', influencerRes.data.id)
      setPitchedGigIds(new Set((pitches ?? []).map((p) => p.gig_id)))
    }

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

  return (
    <div>
      <div className="dash-page-title">Browse Gigs</div>
      <div className="dash-page-subtitle">Find brand campaigns that match your niche and apply with a pitch.</div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search gigs or brands..."
          />
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

      {/* Gig count */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
        {loading ? 'Loading...' : `${filtered.length} gig${filtered.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Gig cards */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 140, borderRadius: 18 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Inbox size={20} /></div>
              <div className="dash-empty-title">No gigs found</div>
              <div className="dash-empty-sub">Try changing your filters or check back soon for new campaigns.</div>
            </div>
          </div>
        ) : (
          filtered.map((gig) => {
            const alreadyPitched = pitchedGigIds.has(gig.id)
            return (
              <div key={gig.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)',
              }}>
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
                    <button
                      onClick={() => { if (!alreadyPitched) { setPitchGig(gig); setPitchMessage('') } }}
                      disabled={alreadyPitched}
                      className={alreadyPitched ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{ marginTop: 12, fontSize: 13, padding: '8px 18px', opacity: alreadyPitched ? 0.6 : 1 }}
                    >
                      {alreadyPitched ? '✓ Pitched' : <><Send size={13} /> Pitch</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pitch Modal */}
      {pitchGig && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 28,
            width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
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
