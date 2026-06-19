'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Briefcase, Search, Pause, Play, Trash2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function gigBadgeClass(status: string) {
  switch (status) {
    case 'active': return 'dash-badge dash-badge-active'
    case 'paused': return 'dash-badge dash-badge-pending'
    case 'completed': return 'dash-badge dash-badge-completed'
    default: return 'dash-badge dash-badge-neutral'
  }
}

export default function AdminGigsPage() {
  const [loading, setLoading] = useState(true)
  const [gigs, setGigs] = useState<(Gig & { pitchCount: number })[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const { data: gigsData } = await supabase
      .from('gigs')
      .select('*, brand_profiles(brand_name, location)')
      .order('created_at', { ascending: false })

    const allGigs = (gigsData as unknown as Gig[]) ?? []

    const { data: pitches } = await supabase
      .from('pitches').select('gig_id')

    const pitchMap: Record<string, number> = {}
    for (const p of pitches ?? []) {
      pitchMap[p.gig_id] = (pitchMap[p.gig_id] ?? 0) + 1
    }

    setGigs(allGigs.map((g) => ({ ...g, pitchCount: pitchMap[g.id] ?? 0 })))
    setLoading(false)
  }

  async function toggleStatus(gig: Gig) {
    setActing(gig.id)
    const supabase = createClient()
    const newStatus = gig.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('gigs').update({ status: newStatus }).eq('id', gig.id)
    if (error) toast.error('Failed to update')
    else {
      toast.success(`Gig ${newStatus}`)
      setGigs((prev) => prev.map((g) => g.id === gig.id ? { ...g, status: newStatus } : g))
    }
    setActing(null)
  }

  async function deleteGig(gig: Gig) {
    if (!confirm(`Delete "${gig.title}"?`)) return
    setActing(gig.id)
    const supabase = createClient()
    const { error } = await supabase.from('gigs').delete().eq('id', gig.id)
    if (error) toast.error('Failed to delete')
    else {
      toast.success('Gig deleted')
      setGigs((prev) => prev.filter((g) => g.id !== gig.id))
    }
    setActing(null)
  }

  const filtered = gigs.filter((g) => {
    const matchSearch = !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      (g.brand_profiles?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || g.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="dash-page-title">All Gigs</div>
      <div className="dash-page-subtitle">View, pause, or delete any gig on the platform.</div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: 36 }} placeholder="Search gigs or brands..." />
        </div>
        {(['all', 'active', 'paused', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: filter === f ? 'var(--brand-primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s ease',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span style={{ opacity: 0.7 }}>({f === 'all' ? gigs.length : gigs.filter((g) => g.status === f).length})</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 100, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Briefcase size={20} /></div>
              <div className="dash-empty-title">No gigs found</div>
            </div>
          </div>
        ) : (
          filtered.map((gig) => (
            <div key={gig.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div className="dash-row-icon"><Briefcase size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dash-row-title" style={{ fontSize: 15 }}>{gig.title}</div>
                <div className="dash-row-meta">
                  {gig.brand_profiles?.brand_name ?? 'Brand'} · {gig.collab_type} · {formatINR(gig.max_budget)}
                  {gig.brand_profiles?.location && ` · ${gig.brand_profiles.location}`}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  {(gig.niche_required ?? []).map((n) => <span key={n} className="badge badge-purple">{n}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                {gig.pitchCount > 0 && (
                  <span className="dash-badge dash-badge-pending">
                    <Users size={11} /> {gig.pitchCount} pitches
                  </span>
                )}
                <span className={gigBadgeClass(gig.status)}>{prettyStatus(gig.status)}</span>
                <button onClick={() => toggleStatus(gig)} disabled={acting === gig.id || gig.status === 'completed'}
                  className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}>
                  {gig.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Activate</>}
                </button>
                <button onClick={() => deleteGig(gig)} disabled={acting === gig.id}
                  className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
