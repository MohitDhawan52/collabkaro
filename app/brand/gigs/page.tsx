'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  PlusCircle,
  Briefcase,
  Pause,
  Play,
  Trash2,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function gigBadgeClass(status: Gig['status']) {
  switch (status) {
    case 'active': return 'dash-badge dash-badge-active'
    case 'paused': return 'dash-badge dash-badge-pending'
    case 'completed': return 'dash-badge dash-badge-completed'
    default: return 'dash-badge dash-badge-neutral'
  }
}

export default function BrandGigsPage() {
  const [loading, setLoading] = useState(true)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [pitchCounts, setPitchCounts] = useState<Record<string, number>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadGigs()
  }, [])

  async function loadGigs() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!brand) { setLoading(false); return }

    const { data: gigsData } = await supabase
      .from('gigs')
      .select('*')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })

    const allGigs = (gigsData as unknown as Gig[]) ?? []
    setGigs(allGigs)

    // Count pitches per gig
    if (allGigs.length > 0) {
      const { data: pitches } = await supabase
        .from('pitches')
        .select('gig_id')
        .in('gig_id', allGigs.map((g) => g.id))
        .eq('status', 'pending')

      const counts: Record<string, number> = {}
      for (const p of pitches ?? []) {
        counts[p.gig_id] = (counts[p.gig_id] ?? 0) + 1
      }
      setPitchCounts(counts)
    }

    setLoading(false)
  }

  async function toggleStatus(gig: Gig) {
    setActionLoading(gig.id)
    const supabase = createClient()
    const newStatus = gig.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase
      .from('gigs')
      .update({ status: newStatus })
      .eq('id', gig.id)

    if (error) {
      toast.error('Could not update gig status')
    } else {
      toast.success(`Gig ${newStatus === 'active' ? 'activated' : 'paused'}`)
      setGigs((prev) => prev.map((g) => g.id === gig.id ? { ...g, status: newStatus } : g))
    }
    setActionLoading(null)
  }

  async function deleteGig(gig: Gig) {
    if (!confirm(`Delete "${gig.title}"? This cannot be undone.`)) return
    setActionLoading(gig.id)
    const supabase = createClient()
    const { error } = await supabase.from('gigs').delete().eq('id', gig.id)
    if (error) {
      toast.error('Could not delete gig')
    } else {
      toast.success('Gig deleted')
      setGigs((prev) => prev.filter((g) => g.id !== gig.id))
    }
    setActionLoading(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="dash-page-title">My Gigs</div>
          <div className="dash-page-subtitle">
            Manage all your campaign listings here.
          </div>
        </div>
        <Link href="/brand/gigs/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <PlusCircle size={16} /> Post a Gig
        </Link>
      </div>

      <div style={{ marginTop: 28 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="dash-skel" style={{ height: 90, borderRadius: 16 }} />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-border)',
            borderRadius: 20,
            boxShadow: 'var(--shadow-card)',
          }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Briefcase size={20} /></div>
              <div className="dash-empty-title">No gigs yet</div>
              <div className="dash-empty-sub">Post your first campaign and start receiving pitches from creators across India.</div>
              <Link href="/brand/gigs/new" className="btn btn-primary" style={{ marginTop: 16, textDecoration: 'none', fontSize: 13 }}>
                <PlusCircle size={14} /> Post a Gig
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {gigs.map((gig) => (
              <div
                key={gig.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 18,
                  padding: '18px 22px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                {/* Icon */}
                <div className="dash-row-icon" style={{ flexShrink: 0 }}>
                  <Briefcase size={18} />
                </div>

                {/* Info — clickable title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/brand/gigs/${gig.id}`} style={{ textDecoration: 'none' }}>
                    <div className="dash-row-title" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {gig.title}
                      <span style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 700, opacity: 0.7 }}>View →</span>
                    </div>
                  </Link>
                  <div className="dash-row-meta" style={{ marginTop: 4 }}>
                    {gig.collab_type} · {gig.platforms?.join(', ')} · Budget: {formatINR(gig.max_budget)}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {(gig.niche_required ?? []).map((n) => (
                      <span key={n} className="badge badge-purple">{n}</span>
                    ))}
                  </div>
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                  {/* Pitch count */}
                  {(pitchCounts[gig.id] ?? 0) > 0 && (
                    <Link
                      href="/brand/pitches"
                      className="dash-badge dash-badge-pending"
                      style={{ textDecoration: 'none', gap: 5 }}
                    >
                      <Users size={11} />
                      {pitchCounts[gig.id]} pitch{pitchCounts[gig.id] > 1 ? 'es' : ''}
                    </Link>
                  )}

                  <span className={gigBadgeClass(gig.status)}>{prettyStatus(gig.status)}</span>

                  {/* Actions */}
                  <button
                    onClick={() => toggleStatus(gig)}
                    disabled={actionLoading === gig.id || gig.status === 'completed'}
                    className="btn btn-secondary"
                    style={{ padding: '7px 14px', fontSize: 12 }}
                    title={gig.status === 'active' ? 'Pause gig' : 'Activate gig'}
                  >
                    {gig.status === 'active'
                      ? <><Pause size={13} /> Pause</>
                      : <><Play size={13} /> Activate</>
                    }
                  </button>

                  <button
                    onClick={() => deleteGig(gig)}
                    disabled={actionLoading === gig.id}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}
                    title="Delete gig"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
