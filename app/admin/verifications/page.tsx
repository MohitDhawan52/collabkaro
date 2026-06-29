'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Clock, CheckCircle2, XCircle, User } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface VerifRequest {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  payment_status: 'paid' | 'unpaid'
  amount: number
  applied_at: string
  reviewed_at: string | null
  admin_note: string | null
  influencer_profiles?: { full_name: string | null; instagram_handle: string | null; niche: string | null } | null
}

export default function AdminVerificationsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<VerifRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [noteModal, setNoteModal] = useState<{ id: string; userId: string; action: 'approve' | 'reject' } | null>(null)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*, influencer_profiles(full_name, instagram_handle, niche)')
      .order('applied_at', { ascending: false })
    if (error) { toast.error(error.message); return }
    setRequests((data as unknown as VerifRequest[]) ?? [])
    setLoading(false)
  }

  async function act(id: string, userId: string, action: 'approve' | 'reject') {
    setActing(true)
    const supabase = createClient()
    const status = action === 'approve' ? 'approved' : 'rejected'

    const { error: reqErr } = await supabase.from('verification_requests').update({
      status,
      admin_note: note || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    if (reqErr) { toast.error(reqErr.message); setActing(false); return }

    if (action === 'approve') {
      await supabase.from('influencer_profiles').update({ is_verified: true }).eq('user_id', userId)
    } else {
      await supabase.from('influencer_profiles').update({ is_verified: false }).eq('user_id', userId)
    }

    toast.success(action === 'approve' ? 'Badge granted!' : 'Request rejected')
    setNoteModal(null)
    setNote('')
    setActing(false)
    load()
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)

  const statusColor: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }
  const statusBg: Record<string, string> = { pending: '#fef3c7', approved: '#ecfdf5', rejected: '#fee2e2' }

  return (
    <div>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BadgeCheck size={22} style={{ color: '#1d4ed8' }} />
        Verification Requests
      </div>
      <div className="dash-page-subtitle">Review and approve creator badge applications.</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 20 }}>
        {[
          { label: 'Pending', val: requests.filter(r => r.status === 'pending').length, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Approved', val: requests.filter(r => r.status === 'approved').length, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Rejected', val: requests.filter(r => r.status === 'rejected').length, color: '#ef4444', bg: '#fee2e2' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: filter === f ? '#1d4ed8' : 'var(--bg-card)', color: filter === f ? '#fff' : 'var(--text-muted)', fontWeight: filter === f ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="dash-skel" style={{ height: 110, borderRadius: 18 }} />)
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon"><BadgeCheck size={20} /></div>
            <div className="dash-empty-title">No {filter} requests</div>
          </div>
        ) : filtered.map(req => {
          const inf = req.influencer_profiles as unknown as { full_name: string | null; instagram_handle: string | null; niche: string | null } | null
          return (
            <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={20} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {inf?.full_name ?? 'Creator'}
                    {req.status === 'approved' && <BadgeCheckSvg />}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {inf?.instagram_handle ? `@${inf.instagram_handle}` : req.user_id.slice(0, 8)}
                    {inf?.niche && ` · ${inf.niche}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Applied {new Date(req.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Payment: ₹{req.amount}
                  </div>
                  {req.admin_note && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>Note: {req.admin_note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: statusBg[req.status], color: statusColor[req.status] }}>
                    {req.status === 'pending' ? <><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />Pending</> : req.status === 'approved' ? <><CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />Approved</> : <><XCircle size={11} style={{ display: 'inline', marginRight: 4 }} />Rejected</>}
                  </span>
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => { setNoteModal({ id: req.id, userId: req.user_id, action: 'approve' }); setNote('') }} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Approve
                      </button>
                      <button onClick={() => { setNoteModal({ id: req.id, userId: req.user_id, action: 'reject' }); setNote('') }} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Note modal */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 6 }}>
              {noteModal.action === 'approve' ? '✅ Approve Verification' : '❌ Reject Verification'}
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              {noteModal.action === 'approve' ? 'Creator will receive the blue badge immediately.' : 'Add a reason (optional, shown to creator).'}
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={noteModal.action === 'approve' ? 'Optional note for creator...' : 'Reason for rejection (e.g. KYC mismatch)...'}
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setNoteModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => act(noteModal.id, noteModal.userId, noteModal.action)} disabled={acting} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: noteModal.action === 'approve' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                {acting ? 'Processing...' : noteModal.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function BadgeCheckSvg() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ display: 'inline', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="#1d4ed8" />
      <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
