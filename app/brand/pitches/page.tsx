'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Users, CheckCircle2, XCircle, AtSign, Play } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notifications'
import type { Pitch } from '@/types/index'

function formatNumber(n: number | null | undefined) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function badgeClass(status: string) {
  switch (status) {
    case 'accepted': return 'dash-badge dash-badge-active'
    case 'rejected': return 'dash-badge dash-badge-rejected'
    case 'withdrawn': return 'dash-badge dash-badge-neutral'
    default: return 'dash-badge dash-badge-pending'
  }
}

export default function BrandPitchesPage() {
  const [loading, setLoading] = useState(true)
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [acting, setActing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')

  useEffect(() => { loadPitches() }, [])

  async function loadPitches() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_profiles').select('id').eq('user_id', user.id).single()
    if (!brand) { setLoading(false); return }

    const { data } = await supabase
      .from('pitches')
      .select('*, gigs(title, max_budget, collab_type), influencer_profiles(full_name, niche, instagram_handle, instagram_followers, youtube_channel, youtube_subscribers, profile_image)')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })

    setPitches((data as unknown as Pitch[]) ?? [])
    setLoading(false)
  }

  async function handleAction(pitch: Pitch, action: 'accepted' | 'rejected') {
    setActing(pitch.id)
    const supabase = createClient()
    const { error } = await supabase
      .from('pitches').update({ status: action }).eq('id', pitch.id)

    if (error) {
      toast.error('Something went wrong')
    } else {
      toast.success(action === 'accepted' ? 'Pitch accepted! Collaboration started.' : 'Pitch rejected.')
      setPitches((prev) => prev.map((p) => p.id === pitch.id ? { ...p, status: action } : p))

      if (action === 'accepted') {
        await supabase.from('collaborations').insert({
          pitch_id: pitch.id,
          gig_id: pitch.gig_id,
          brand_id: pitch.brand_id,
          influencer_id: pitch.influencer_id,
          collab_type: pitch.gigs?.collab_type === 'barter' ? 'barter' : 'paid',
          agreed_amount: pitch.gigs?.max_budget ?? null,
          status: 'agreement_pending',
          brand_payment_status: 'pending',
          influencer_payment_status: 'pending',
        })
        // Notify the influencer — look up their user_id from influencer_profiles
        const { data: infProfile } = await supabase
          .from('influencer_profiles').select('user_id').eq('id', pitch.influencer_id).single()
        if (infProfile?.user_id) {
          await notify({
            userId: infProfile.user_id,
            title: 'Pitch Accepted! 🎉',
            message: `Your pitch for "${pitch.gigs?.title ?? 'a gig'}" has been accepted. Go to Collaborations and sign the agreement to get started.`,
            type: 'success',
          })
        }
      }
    }
    setActing(null)
  }

  const filtered = filter === 'all' ? pitches : pitches.filter((p) => p.status === filter)

  return (
    <div>
      <div className="dash-page-title">Pitches Received</div>
      <div className="dash-page-subtitle">Review and respond to influencer applications on your gigs.</div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
        {(['pending', 'accepted', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none',
              background: filter === f ? 'var(--brand-primary)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              boxShadow: filter === f ? '0 2px 8px rgba(109,40,217,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {f === 'all' ? 'All' : prettyStatus(f)}
            {' '}
            <span style={{ opacity: 0.7 }}>
              ({f === 'all' ? pitches.length : pitches.filter((p) => p.status === f).length})
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="dash-skel" style={{ height: 120, borderRadius: 16 }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Users size={20} /></div>
              <div className="dash-empty-title">No pitches here</div>
              <div className="dash-empty-sub">
                {filter === 'pending' ? 'No pending pitches right now.' : `No ${filter} pitches yet.`}
              </div>
            </div>
          </div>
        ) : (
          filtered.map((pitch) => (
            <div key={pitch.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                {/* Avatar — clickable to profile */}
                <Link href={`/brand/influencers/${pitch.influencer_id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#a855f7,#ec4899)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18, cursor: 'pointer',
                  }}>
                    {pitch.influencer_profiles?.full_name?.charAt(0)?.toUpperCase() ?? 'I'}
                  </div>
                </Link>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Link href={`/brand/influencers/${pitch.influencer_id}`} style={{ textDecoration: 'none' }}>
                      <div className="dash-row-title" style={{ fontSize: 15, color: '#0c1445', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#0c1445')}>
                        {pitch.influencer_profiles?.full_name ?? 'Influencer'} ↗
                      </div>
                    </Link>
                    <span className={badgeClass(pitch.status)}>{prettyStatus(pitch.status)}</span>
                  </div>

                  <div className="dash-row-meta" style={{ marginTop: 3 }}>
                    Applied for: <strong>{pitch.gigs?.title ?? 'Gig'}</strong>
                  </div>

                  {/* Social stats */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    {pitch.influencer_profiles?.instagram_handle && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <AtSign size={13} />
                        {pitch.influencer_profiles.instagram_handle}
                        {pitch.influencer_profiles.instagram_followers && (
                          <span style={{ fontWeight: 600 }}>· {formatNumber(pitch.influencer_profiles.instagram_followers)}</span>
                        )}
                      </span>
                    )}
                    {pitch.influencer_profiles?.youtube_channel && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Play size={13} />
                        {pitch.influencer_profiles.youtube_channel}
                        {pitch.influencer_profiles.youtube_subscribers && (
                          <span style={{ fontWeight: 600 }}>· {formatNumber(pitch.influencer_profiles.youtube_subscribers)}</span>
                        )}
                      </span>
                    )}
                    {(pitch.influencer_profiles?.niche ?? []).slice(0, 3).map((n) => (
                      <span key={n} className="badge badge-purple">{n}</span>
                    ))}
                  </div>

                  {/* Message */}
                  {pitch.message && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', borderRadius: 10,
                      background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                    }}>
                      "{pitch.message}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                {pitch.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleAction(pitch, 'rejected')}
                      disabled={acting === pitch.id}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: 13, color: '#DC2626', borderColor: '#FCA5A5' }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleAction(pitch, 'accepted')}
                      disabled={acting === pitch.id}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: 13 }}
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
