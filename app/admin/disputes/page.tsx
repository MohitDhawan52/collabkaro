'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notifications'

type DisputeStatus = 'open' | 'resolved' | 'closed'
type Favor = 'brand' | 'influencer' | 'mutual'

interface Dispute {
  id: string
  collab_id: string
  raised_by: string
  raised_by_role: 'brand' | 'influencer'
  reason: string
  description: string
  status: DisputeStatus
  resolution: string | null
  resolved_in_favor_of: Favor | null
  created_at: string
  resolved_at: string | null
  collaborations?: {
    id: string
    agreed_amount: number | null
    collab_type: string
    brand_profiles?: { brand_name: string | null; user_id?: string } | null
    influencer_profiles?: { full_name: string | null; user_id?: string } | null
    gigs?: { title: string | null } | null
  } | null
}

function StatusChip({ status }: { status: DisputeStatus }) {
  const cfg = {
    open:     { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', label: 'Open' },
    resolved: { bg: 'rgba(16,185,129,0.1)',  color: '#059669', label: 'Resolved' },
    closed:   { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Closed' },
  }
  const c = cfg[status]
  return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>{c.label}</span>
}

function FavorChip({ favor }: { favor: Favor | null }) {
  if (!favor) return null
  const cfg = {
    brand:      { bg: 'rgba(249,115,22,0.1)', color: '#ea580c', label: 'Favor: Brand' },
    influencer: { bg: 'rgba(168,85,247,0.1)', color: '#7c3aed', label: 'Favor: Influencer' },
    mutual:     { bg: 'rgba(29,78,216,0.1)',  color: '#1d4ed8', label: 'Mutual Resolution' },
  }
  const c = cfg[favor]
  return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>{c.label}</span>
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | DisputeStatus>('open')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [resolution, setResolution] = useState<Record<string, string>>({})
  const [favor, setFavor] = useState<Record<string, Favor>>({})
  const [collabOutcome, setCollabOutcome] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('disputes')
      .select(`*, collaborations(id, agreed_amount, collab_type, gigs(title), brand_profiles(brand_name, user_id), influencer_profiles(full_name, user_id))`)
      .order('created_at', { ascending: false })
    if (error) { toast.error(error.message); setLoading(false); return }
    setDisputes((data ?? []) as Dispute[])
    setLoading(false)
  }

  async function resolve(dispute: Dispute) {
    const res = resolution[dispute.id]?.trim()
    const fav = favor[dispute.id]
    const outcome = collabOutcome[dispute.id]
    if (!res) { toast.error('Provide a resolution note'); return }
    if (!fav) { toast.error('Select who the dispute is resolved in favor of'); return }
    if (!outcome) { toast.error('Select the collab outcome'); return }

    setActing(dispute.id)
    const supabase = createClient()

    // Resolve dispute
    const { error } = await supabase.from('disputes').update({
      status: 'resolved',
      resolution: res,
      resolved_in_favor_of: fav,
      resolved_at: new Date().toISOString(),
    }).eq('id', dispute.id)
    if (error) { toast.error(error.message); setActing(null); return }

    // Update collab status
    if (outcome) {
      await supabase.from('collaborations').update({ status: outcome }).eq('id', dispute.collab_id)
    }

    // Notify both parties
    const brandUserId = (dispute.collaborations?.brand_profiles as { user_id?: string } | null | undefined)?.user_id
    const influencerUserId = (dispute.collaborations?.influencer_profiles as { user_id?: string } | null | undefined)?.user_id
    const gigTitle = dispute.collaborations?.gigs?.title ?? 'your collaboration'
    const favorLabel = fav === 'mutual' ? 'mutual resolution' : `in favor of the ${fav}`
    const msg = `Your dispute on "${gigTitle}" has been resolved (${favorLabel}). Resolution: ${res}`

    if (brandUserId) await notify({ userId: brandUserId, title: 'Dispute Resolved', message: msg, type: 'info' })
    if (influencerUserId) await notify({ userId: influencerUserId, title: 'Dispute Resolved', message: msg, type: 'info' })

    toast.success('Dispute resolved and both parties notified.')
    setActing(null)
    setExpanded(null)
    load()
  }

  const filtered = disputes.filter(d => filter === 'all' || d.status === filter)
  const counts = { all: disputes.length, open: disputes.filter(d => d.status === 'open').length, resolved: disputes.filter(d => d.status === 'resolved').length, closed: disputes.filter(d => d.status === 'closed').length }

  const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.8)',
    borderRadius: 18, padding: '20px', backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 12px rgba(29,78,216,0.07)', marginBottom: 14,
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '9px 14px', borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.8)',
    fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Scale size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0c1445', letterSpacing: -0.4 }}>Dispute Resolution</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Review and resolve disputes between brands and influencers</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['open', 'all', 'resolved', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: filter === f ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'rgba(255,255,255,0.65)', color: filter === f ? '#fff' : '#374151', boxShadow: filter === f ? '0 2px 10px rgba(220,38,38,0.25)' : '0 1px 4px rgba(0,0,0,0.07)' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading && [1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.5)', marginBottom: 12 }} />)}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af', fontSize: 15 }}>
          No {filter === 'all' ? '' : filter} disputes.
        </div>
      )}

      {filtered.map(dispute => {
        const isOpen = expanded === dispute.id
        const collab = dispute.collaborations
        const gigTitle = collab?.gigs?.title ?? 'Collaboration'
        const brand = collab?.brand_profiles?.brand_name ?? 'Brand'
        const influencer = collab?.influencer_profiles?.full_name ?? 'Influencer'

        return (
          <div key={dispute.id} style={CARD}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : dispute.id)}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={17} style={{ color: '#dc2626' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0c1445' }}>{gigTitle}</div>
                <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
                  {brand} vs {influencer} · Raised by <strong>{dispute.raised_by_role}</strong> · {new Date(dispute.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 12.5, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>"{dispute.reason}"</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <StatusChip status={dispute.status} />
                {dispute.resolved_in_favor_of && <FavorChip favor={dispute.resolved_in_favor_of} />}
                <div style={{ color: '#9ca3af' }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 18, borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 18 }}>
                {/* Description */}
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', fontSize: 13.5, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Complaint</div>
                  {dispute.description}
                </div>

                {/* Collab info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[['Brand', brand], ['Influencer', influencer], ['Type / Amount', `${collab?.collab_type ?? 'paid'} · ${collab?.agreed_amount ? `₹${collab.agreed_amount.toLocaleString('en-IN')}` : 'Barter'}`]].map(([label, val]) => (
                    <div key={label} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(29,78,216,0.04)', border: '1px solid rgba(29,78,216,0.1)' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0c1445' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {dispute.status === 'open' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Favor */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Resolve in favor of *</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(['brand', 'influencer', 'mutual'] as Favor[]).map(f => (
                          <button key={f} onClick={() => setFavor(p => ({ ...p, [dispute.id]: f }))}
                            style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderColor: favor[dispute.id] === f ? '#1d4ed8' : 'rgba(0,0,0,0.12)', background: favor[dispute.id] === f ? 'rgba(29,78,216,0.08)' : '#fff', color: favor[dispute.id] === f ? '#1d4ed8' : '#374151' }}>
                            {f === 'mutual' ? 'Mutual Resolution' : `${f.charAt(0).toUpperCase() + f.slice(1)}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collab outcome */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Collab outcome *</label>
                      <select value={collabOutcome[dispute.id] ?? ''} onChange={e => setCollabOutcome(p => ({ ...p, [dispute.id]: e.target.value }))} style={{ ...INPUT, width: 'auto', minWidth: 260 }}>
                        <option value="">Select outcome…</option>
                        <option value="active">Resume — mark as Active</option>
                        <option value="completed">Close — mark as Completed</option>
                        <option value="cancelled">Cancel — mark as Cancelled</option>
                      </select>
                    </div>

                    {/* Resolution note */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Resolution note *</label>
                      <textarea
                        value={resolution[dispute.id] ?? ''}
                        onChange={e => setResolution(p => ({ ...p, [dispute.id]: e.target.value }))}
                        placeholder="Explain the resolution decision. Both parties will receive this in their notification."
                        rows={3}
                        style={{ ...INPUT, resize: 'vertical', lineHeight: 1.5 }}
                      />
                    </div>

                    <button
                      disabled={acting === dispute.id}
                      onClick={() => resolve(dispute)}
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 3px 12px rgba(29,78,216,0.3)', opacity: acting === dispute.id ? 0.6 : 1 }}>
                      <CheckCircle2 size={15} /> {acting === dispute.id ? 'Resolving…' : 'Resolve Dispute'}
                    </button>
                  </div>
                )}

                {dispute.status === 'resolved' && (
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Resolution</div>
                    <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, marginBottom: 8 }}>{dispute.resolution}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Resolved on {dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
