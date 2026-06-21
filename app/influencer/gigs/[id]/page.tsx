'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles, IndianRupee, Users, Clock, Send, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig } from '@/types/index'

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

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyPitched, setAlreadyPitched] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pitchMessage, setPitchMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [gigRes, influencerRes] = await Promise.all([
        supabase.from('gigs').select('*, brand_profiles(brand_name, industry, location, description)').eq('id', id).single(),
        supabase.from('influencer_profiles').select('id').eq('user_id', user.id).single(),
      ])

      setGig(gigRes.data as unknown as Gig)

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
      .from('influencer_profiles').select('id').eq('user_id', user.id).single()
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
      toast.success('Pitch sent!')
      setAlreadyPitched(true)
      setShowModal(false)
      setPitchMessage('')
    }
    setSubmitting(false)
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
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: '24px 26px', boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
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
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 10 }}>What the brand expects</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{gig.deliverables}</div>
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
                placeholder="Introduce yourself, explain why you're a great fit, mention your audience stats..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
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
