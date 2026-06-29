'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

type KYCStatus = 'pending' | 'approved' | 'rejected'

interface KYCRecord {
  id: string
  user_id: string
  pan_number: string | null
  pan_image_url: string | null
  aadhaar_number: string | null
  aadhaar_front_url: string | null
  aadhaar_back_url: string | null
  status: KYCStatus
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  influencer_profiles?: { full_name: string | null; instagram_handle: string | null; niche: string | null } | null
}

function maskAadhaar(n: string | null) {
  if (!n) return '—'
  return 'XXXX XXXX ' + n.slice(-4)
}

function StatusChip({ status }: { status: KYCStatus }) {
  const cfg: Record<KYCStatus, { bg: string; color: string; label: string }> = {
    pending:  { bg: 'rgba(249,115,22,0.1)',  color: '#ea580c', label: 'Pending Review' },
    approved: { bg: 'rgba(16,185,129,0.1)',  color: '#059669', label: 'Approved' },
    rejected: { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', label: 'Rejected' },
  }
  const c = cfg[status]
  return (
    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

export default function AdminKYCPage() {
  const [records, setRecords] = useState<KYCRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | KYCStatus>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rejReason, setRejReason] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (error) {
      if (error.message.includes('kyc_documents')) {
        toast.error('Run the kyc_documents SQL migration in Supabase first')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    // Fetch influencer profiles separately (no FK constraint needed)
    const userIds = (data ?? []).map((r: { user_id: string }) => r.user_id)
    let profileMap: Record<string, { full_name: string | null; instagram_handle: string | null; niche: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('influencer_profiles')
        .select('user_id, full_name, instagram_handle, niche')
        .in('user_id', userIds)
      for (const p of profiles ?? []) profileMap[p.user_id] = p
    }

    setRecords((data ?? []).map((r: { user_id: string }) => ({ ...r, influencer_profiles: profileMap[r.user_id] ?? null })) as KYCRecord[])
    setLoading(false)
  }

  async function decide(id: string, userId: string, status: 'approved' | 'rejected', reason?: string) {
    if (status === 'rejected' && !reason?.trim()) { toast.error('Provide a rejection reason'); return }
    setActing(id)
    const supabase = createClient()
    const { error } = await supabase.from('kyc_documents').update({
      status,
      rejection_reason: status === 'rejected' ? reason!.trim() : null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error(error.message); setActing(null); return }

    // notify influencer
    await supabase.from('notifications').insert({
      user_id: userId,
      title: status === 'approved' ? 'KYC Verified ✓' : 'KYC Rejected',
      message: status === 'approved'
        ? 'Your identity has been verified. You can now receive payouts!'
        : `Your KYC was rejected. Reason: ${reason}. Please re-submit.`,
      type: status === 'approved' ? 'system' : 'system',
      read: false,
    })

    toast.success(status === 'approved' ? 'KYC approved!' : 'KYC rejected.')
    setActing(null)
    setExpanded(null)
    load()
  }

  const filtered = records.filter(r => filter === 'all' || r.status === filter)

  const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.8)',
    borderRadius: 18, padding: '20px', backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 12px rgba(29,78,216,0.07)', marginBottom: 14,
  }

  const counts = {
    all: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    approved: records.filter(r => r.status === 'approved').length,
    rejected: records.filter(r => r.status === 'rejected').length,
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0c1445', letterSpacing: -0.4 }}>KYC Verification</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Review and approve influencer identity documents</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? 'linear-gradient(135deg,#1d4ed8,#06b6d4)' : 'rgba(255,255,255,0.65)',
              color: filter === f ? '#fff' : '#374151',
              boxShadow: filter === f ? '0 2px 10px rgba(29,78,216,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {loading && [1,2,3].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.5)', marginBottom: 12 }} />
      ))}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af', fontSize: 15 }}>
          No {filter === 'all' ? '' : filter} KYC submissions.
        </div>
      )}

      {filtered.map(rec => {
        const isOpen = expanded === rec.id
        const name = rec.influencer_profiles?.full_name ?? 'Unknown Influencer'
        const handle = rec.influencer_profiles?.instagram_handle
        const niche = rec.influencer_profiles?.niche

        return (
          <div key={rec.id} style={CARD}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : rec.id)}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,rgba(29,78,216,0.12),rgba(6,182,212,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#1d4ed8' }}>{name[0]?.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0c1445' }}>
                  {name} {handle && <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 13 }}>@{handle}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {niche && `${niche} · `}Submitted {new Date(rec.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <StatusChip status={rec.status} />
              <div style={{ color: '#9ca3af', marginLeft: 4 }}>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {/* Expanded details */}
            {isOpen && (
              <div style={{ marginTop: 18, borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 18 }}>
                {/* Document info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>PAN Card</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0c1445', letterSpacing: 1, marginBottom: 8 }}>{rec.pan_number ?? '—'}</div>
                    {rec.pan_image_url ? (
                      <a href={rec.pan_image_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
                        <Eye size={13} /> View Image
                      </a>
                    ) : <span style={{ fontSize: 12, color: '#9ca3af' }}>No image</span>}
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(29,78,216,0.05)', border: '1px solid rgba(29,78,216,0.12)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Aadhaar</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0c1445', letterSpacing: 1, marginBottom: 8 }}>{maskAadhaar(rec.aadhaar_number)}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {rec.aadhaar_front_url && (
                        <a href={rec.aadhaar_front_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
                          <Eye size={13} /> Front
                        </a>
                      )}
                      {rec.aadhaar_back_url && (
                        <a href={rec.aadhaar_back_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
                          <Eye size={13} /> Back
                        </a>
                      )}
                      {!rec.aadhaar_front_url && !rec.aadhaar_back_url && <span style={{ fontSize: 12, color: '#9ca3af' }}>No images</span>}
                    </div>
                  </div>
                </div>

                {rec.rejection_reason && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                    <strong>Previous rejection reason:</strong> {rec.rejection_reason}
                  </div>
                )}

                {/* Actions */}
                {rec.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <button
                      disabled={acting === rec.id}
                      onClick={() => decide(rec.id, rec.user_id, 'approved')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px',
                        borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        color: '#fff', fontWeight: 700, fontSize: 13,
                        boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                        opacity: acting === rec.id ? 0.6 : 1,
                      }}
                    >
                      <CheckCircle2 size={14} /> Approve KYC
                    </button>

                    <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
                      <input
                        placeholder="Rejection reason…"
                        value={rejReason[rec.id] ?? ''}
                        onChange={e => setRejReason(p => ({ ...p, [rec.id]: e.target.value }))}
                        style={{
                          flex: 1, padding: '9px 14px', borderRadius: 12,
                          border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(255,255,255,0.8)',
                          fontSize: 13, outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                      <button
                        disabled={acting === rec.id}
                        onClick={() => decide(rec.id, rec.user_id, 'rejected', rejReason[rec.id])}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                          borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: 'rgba(239,68,68,0.9)', color: '#fff',
                          fontWeight: 700, fontSize: 13,
                          opacity: acting === rec.id ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}

                {rec.status !== 'pending' && rec.reviewed_at && (
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {rec.status === 'approved' ? 'Approved' : 'Rejected'} on {new Date(rec.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
