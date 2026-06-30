'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles, IndianRupee, Users, Clock, Send, X, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/sendEmail'
import { pitchReceivedEmail } from '@/lib/emailTemplates'
import type { Gig } from '@/types/index'

interface ParsedDeliverable { type: string; emoji: string; qty: number; due_date: string }

function formatINR(amount: number | null | undefined) {
  if (amount == null) return 'Open to negotiate'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatNumber(n: number | null | undefined) {
  if (!n) return null
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function trackEvent(ad_id: string, event_type: 'impression' | 'view' | 'pitch_click', viewer_user_id: string) {
  try {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id, event_type, viewer_user_id }),
    })
  } catch { /* silent */ }
}

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyPitched, setAlreadyPitched] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pitchMessage, setPitchMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isSponsored, setIsSponsored] = useState(false)
  const [adId, setAdId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const [gigRes, influencerRes, adRes] = await Promise.all([
        supabase.from('gigs').select('*, brand_profiles(brand_name, industry, location, description)').eq('id', id).single(),
        supabase.from('influencer_profiles').select('id').eq('user_id', user.id).single(),
        supabase.from('gig_ads').select('id').eq('gig_id', id).eq('status', 'active').maybeSingle(),
      ])

      setGig(gigRes.data as unknown as Gig)

      if (adRes.data?.id) {
        setIsSponsored(true)
        setAdId(adRes.data.id)
        // Fire VIEW — influencer opened the detail page (distinct from impression = list card shown)
        trackEvent(adRes.data.id, 'view', user.id)
      }

      if (influencerRes.data) {
        const { data: pitch } = await supabase
          .from('pitches').select('id').eq('gig_id', id).eq('influencer_id', influencerRes.data.id).maybeSingle()
        setAlreadyPitched(!!pitch)
      }

      setLoading(false)
    }
    load()
  }, [id])

  async function submitPitch() {
    if (!pitchMessage.trim()) { toast.error('Please write a message'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !gig) { setSubmitting(false); return }

    const { data: influencer } = await supabase
      .from('influencer_profiles').select('id, full_name').eq('user_id', user.id).single()
    if (!influencer) { toast.error('Profile not found'); setSubmitting(false); return }

    const { error } = await supabase.from('pitches').insert({
      gig_id: gig.id,
      brand_id: gig.brand_id,
      influencer_id: influencer.id,
      message: pitchMessage.trim(),
      status: 'pending',
    })

    if (error) toast.error('Could not submit pitch')
    else {
      // Track pitch_click for sponsored gig
      if (adId && currentUserId) {
        trackEvent(adId, 'pitch_click', currentUserId)
      }
      toast.success('Pitch sent!')
      setAlreadyPitched(true)
      setShowModal(false)
      setPitchMessage('')
      const { data: brandProfile } = await supabase
        .from('brand_profiles').select('user_id, brand_name').eq('id', gig.brand_id).single()
      if (brandProfile?.user_id) {
        const { subject, html } = pitchReceivedEmail(
          brandProfile.brand_name ?? 'Brand',
          (influencer as unknown as { full_name: string }).full_name ?? 'Influencer',
          gig.title,
          pitchMessage.trim(),
        )
        await sendEmail(brandProfile.user_id, subject, html)
      }
    }
    setSubmitting(false)
  }

  // Parse deliverables JSON
  let parsedDeliverables: ParsedDeliverable[] = []
  if (gig?.deliverables) {
    try { parsedDeliverables = JSON.parse(gig.deliverables) } catch { /* legacy text */ }
  }

  if (loading) return (
    <div>
      <div className="dash-skel" style={{ height: 32, width: 120, borderRadius: 8, marginBottom: 24 }} />
      <div className="dash-skel" style={{ height: 300, borderRadius: 18 }} />
    </div>
  )

  if (!gig) return (
    <div>
      <button onClick={() => router.back()} className="dash-nav-item" style={{ width: 'auto', paddingLeft: 0, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Gig not found.</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 680 }}>
      <button onClick={() => router.back()} className="dash-nav-item" style={{ width: 'auto', paddingLeft: 0, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header card */}
      <div style={{
        background: isSponsored ? 'linear-gradient(135deg,#fffbeb,#fff7ed)' : 'var(--bg-card)',
        border: isSponsored ? '1.5px solid #fde68a' : '1px solid var(--bg-border)',
        borderRadius: 20, padding: '24px 26px',
        boxShadow: isSponsored ? '0 6px 24px rgba(245,158,11,0.13)' : 'var(--shadow-card)',
        marginBottom: 16,
      }}>
        {/* Sponsored badge */}
        {isSponsored && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'linear-gradient(90deg,#f59e0b,#f97316)', color: '#fff', fontSize: 11.5, fontWeight: 800, marginBottom: 14, letterSpacing: 0.3 }}>
            ⚡ SPONSORED
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div className="dash-row-icon" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }}>
            <Sparkles size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{gig.title}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
              by {gig.brand_profiles?.brand_name ?? 'Brand'}
              {gig.brand_profiles?.location && ` · ${gig.brand_profiles.location}`}
              {gig.brand_profiles?.industry && ` · ${gig.brand_profiles.industry}`}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <span className="badge badge-purple">{gig.collab_type}</span>
              {(gig.platforms ?? []).map((p) => <span key={p} className="badge badge-gray">{p}</span>)}
              {(gig.niche_required ?? []).map((n) => <span key={n} className="badge badge-amber">{n}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { icon: <IndianRupee size={15} />, label: 'You Earn', value: gig.max_budget ? formatINR(Math.floor(gig.max_budget * 0.9)) : '—' },
          { icon: <Users size={15} />, label: 'Min Followers', value: formatNumber(gig.min_followers) ?? 'Any' },
          { icon: <Clock size={15} />, label: 'Timeline', value: gig.timeline ?? 'Flexible' },
        ].map((stat) => (
          <div key={stat.label} className="dash-stat-card" style={{ padding: '14px 16px' }}>
            <div className="dash-stat-label">{stat.icon} {stat.label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginTop: 6 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 10 }}>About this campaign</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{gig.description}</div>
      </div>

      {/* Deliverables */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>What the brand expects</div>
        {parsedDeliverables.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {parsedDeliverables.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-input)', border: '1.5px solid var(--bg-border)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{d.emoji}</span>
                  {d.qty}× {d.type}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Calendar size={12} /> Due {fmtDate(d.due_date)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {gig.deliverables ?? 'No specific deliverables listed'}
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => { if (!alreadyPitched) setShowModal(true) }}
        disabled={alreadyPitched}
        className={alreadyPitched ? 'btn btn-secondary' : 'btn btn-primary'}
        style={{ width: '100%', fontSize: 15, padding: '14px', opacity: alreadyPitched ? 0.7 : 1 }}
      >
        {alreadyPitched ? '✓ You already pitched for this gig' : <><Send size={15} /> Send Pitch to this Brand</>}
      </button>

      {/* Pitch Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Send a Pitch</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{gig.title}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
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
                placeholder="Tell the brand why you're a great fit, your content style, reach, and how you'll promote their product..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <button
              onClick={submitPitch}
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 14 }}
            >
              {submitting ? 'Sending...' : <><Send size={14} /> Send Pitch</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
