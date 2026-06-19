'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { GitMerge, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function badgeClass(status: string) {
  if (status === 'completed') return 'dash-badge dash-badge-completed'
  if (status === 'cancelled' || status === 'disputed') return 'dash-badge dash-badge-rejected'
  if (status === 'active') return 'dash-badge dash-badge-active'
  return 'dash-badge dash-badge-pending'
}

const ALL_STATUSES: Collaboration['status'][] = [
  'agreement_pending', 'agreement_signed_influencer', 'agreement_signed_brand',
  'active', 'deliverable_submitted', 'deliverable_approved', 'completed', 'cancelled', 'disputed'
]

export default function AdminCollabsPage() {
  const [loading, setLoading] = useState(true)
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('collaborations')
      .select('*, gigs(title), brand_profiles(brand_name), influencer_profiles(full_name)')
      .order('created_at', { ascending: false })
    setCollabs((data as unknown as Collaboration[]) ?? [])
    setLoading(false)
  }

  async function updateStatus(collab: Collaboration, newStatus: Collaboration['status']) {
    setActing(collab.id)
    const supabase = createClient()
    const { error } = await supabase.from('collaborations').update({ status: newStatus }).eq('id', collab.id)
    if (error) toast.error('Failed to update')
    else {
      toast.success('Status updated')
      setCollabs((prev) => prev.map((c) => c.id === collab.id ? { ...c, status: newStatus } : c))
    }
    setActing(null)
  }

  const filtered = collabs.filter((c) => {
    const matchSearch = !search ||
      (c.gigs?.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.brand_profiles?.brand_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.influencer_profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="dash-page-title">Collaborations</div>
      <div className="dash-page-subtitle">View and manage all collaborations. Change status or resolve disputes.</div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: 36 }} placeholder="Search by gig, brand or influencer..." />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input" style={{ width: 200 }}>
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{prettyStatus(s)}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 120, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><GitMerge size={20} /></div>
              <div className="dash-empty-title">No collaborations found</div>
            </div>
          </div>
        ) : (
          filtered.map((collab) => (
            <div key={collab.id} style={{
              background: 'var(--bg-card)', border: collab.status === 'disputed' ? '1.5px solid #FCA5A5' : '1px solid var(--bg-border)',
              borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div className="dash-row-icon"><GitMerge size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="dash-row-title" style={{ fontSize: 15 }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                    <span className={badgeClass(collab.status)}>{prettyStatus(collab.status)}</span>
                    {collab.status === 'disputed' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: 999 }}>⚠ DISPUTE</span>
                    )}
                  </div>
                  <div className="dash-row-meta" style={{ marginTop: 3 }}>
                    Brand: <strong>{collab.brand_profiles?.brand_name ?? '—'}</strong> · Influencer: <strong>{collab.influencer_profiles?.full_name ?? '—'}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    Amount: {formatINR(collab.agreed_amount)} · Payout: {formatINR(collab.influencer_payout)} · Type: {collab.collab_type}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    Brand payment: <strong>{collab.brand_payment_status}</strong> · Influencer payment: <strong>{collab.influencer_payment_status}</strong>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <select
                    value={collab.status}
                    onChange={(e) => updateStatus(collab, e.target.value as Collaboration['status'])}
                    disabled={acting === collab.id}
                    className="input"
                    style={{ fontSize: 12, padding: '7px 12px', width: 200 }}
                  >
                    {ALL_STATUSES.map((s) => <option key={s} value={s}>{prettyStatus(s)}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
