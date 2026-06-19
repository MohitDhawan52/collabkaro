'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Send, Inbox, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Pitch } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
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

export default function MyPitchesPage() {
  const [loading, setLoading] = useState(true)
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [withdrawing, setWithdrawing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: influencer } = await supabase
      .from('influencer_profiles').select('id').eq('user_id', user.id).single()
    if (!influencer) { setLoading(false); return }

    const { data } = await supabase
      .from('pitches')
      .select('*, gigs(title, max_budget, collab_type, platforms), brand_profiles(brand_name, location)')
      .eq('influencer_id', influencer.id)
      .order('created_at', { ascending: false })

    setPitches((data as unknown as Pitch[]) ?? [])
    setLoading(false)
  }

  async function withdraw(pitch: Pitch) {
    if (!confirm('Withdraw this pitch?')) return
    setWithdrawing(pitch.id)
    const supabase = createClient()
    const { error } = await supabase.from('pitches').update({ status: 'withdrawn' }).eq('id', pitch.id)
    if (error) toast.error('Could not withdraw pitch')
    else {
      toast.success('Pitch withdrawn')
      setPitches((prev) => prev.map((p) => p.id === pitch.id ? { ...p, status: 'withdrawn' } : p))
    }
    setWithdrawing(null)
  }

  const filtered = filter === 'all' ? pitches : pitches.filter((p) => p.status === filter)

  return (
    <div>
      <div className="dash-page-title">My Pitches</div>
      <div className="dash-page-subtitle">Track all the pitches you've sent to brands.</div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none',
            background: filter === f ? 'var(--brand-primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)',
            boxShadow: filter === f ? '0 2px 8px rgba(109,40,217,0.25)' : 'none',
            transition: 'all 0.15s ease',
          }}>
            {f === 'all' ? 'All' : prettyStatus(f)}{' '}
            <span style={{ opacity: 0.7 }}>({f === 'all' ? pitches.length : pitches.filter((p) => p.status === f).length})</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 100, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Inbox size={20} /></div>
              <div className="dash-empty-title">No pitches yet</div>
              <div className="dash-empty-sub">Browse gigs and send your first pitch to a brand.</div>
            </div>
          </div>
        ) : (
          filtered.map((pitch) => (
            <div key={pitch.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <div className="dash-row-icon"><Send size={17} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dash-row-title">{pitch.gigs?.title ?? 'Gig'}</div>
                <div className="dash-row-meta">
                  {pitch.brand_profiles?.brand_name ?? 'Brand'}
                  {pitch.brand_profiles?.location && ` · ${pitch.brand_profiles.location}`}
                  {pitch.gigs?.collab_type && ` · ${pitch.gigs.collab_type}`}
                </div>
                {pitch.message && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                    "{pitch.message.slice(0, 100)}{pitch.message.length > 100 ? '...' : ''}"
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="dash-row-title">{formatINR(pitch.gigs?.max_budget)}</div>
                  <span className={badgeClass(pitch.status)} style={{ marginTop: 4 }}>{prettyStatus(pitch.status)}</span>
                </div>
                {pitch.status === 'pending' && (
                  <button
                    onClick={() => withdraw(pitch)}
                    disabled={withdrawing === pitch.id}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}
                    title="Withdraw pitch"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
