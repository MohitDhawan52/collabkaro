'use client'

import { useState } from 'react'
import { AlertTriangle, X, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notifications'

interface Props {
  collabId: string
  collabTitle: string
  myRole: 'brand' | 'influencer'
  otherPartyUserId: string
  onClose: () => void
  onRaised: () => void
}

const REASONS = [
  'Deliverable not submitted on time',
  'Deliverable does not match agreed scope',
  'Payment not released after approval',
  'Brand not responding',
  'Influencer not responding',
  'Content quality issue',
  'Agreement terms violated',
  'Other',
]

export default function DisputeModal({ collabId, collabTitle, myRole, otherPartyUserId, onClose, onRaised }: Props) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!reason) { toast.error('Please select a reason'); return }
    if (!description.trim()) { toast.error('Please describe the issue'); return }
    setSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    // Insert dispute
    const { error: dErr } = await supabase.from('disputes').insert({
      collab_id: collabId,
      raised_by: user.id,
      raised_by_role: myRole,
      reason,
      description: description.trim(),
      status: 'open',
    })
    if (dErr) { toast.error('Failed to raise dispute: ' + dErr.message); setSubmitting(false); return }

    // Update collab status to disputed
    await supabase.from('collaborations').update({ status: 'disputed' }).eq('id', collabId)

    // Notify other party
    await notify(otherPartyUserId, 'Dispute Raised', `A dispute has been raised on "${collabTitle}". CollabKaro will review and resolve it.`, 'system')

    // Notify admins (fetch admin user IDs)
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    for (const admin of admins ?? []) {
      await notify(admin.id, 'New Dispute Filed', `${myRole === 'brand' ? 'Brand' : 'Influencer'} raised a dispute on "${collabTitle}". Reason: ${reason}`, 'system')
    }

    toast.success('Dispute raised. CollabKaro will review within 2 business days.')
    onRaised()
    onClose()
    setSubmitting(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: '28px 28px 24px', maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0c1445' }}>Raise a Dispute</div>
              <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>CollabKaro will review and resolve within 2 business days</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Collab context */}
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(29,78,216,0.05)', border: '1px solid rgba(29,78,216,0.12)', fontSize: 13, color: '#374151', marginBottom: 20 }}>
          <strong>Collab:</strong> {collabTitle}
        </div>

        {/* Reason select */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Reason *</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: reason ? '#0c1445' : '#9ca3af' }}
          >
            <option value="">Select a reason…</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Describe the issue *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide specific details about the problem. Include dates, messages, or any evidence that supports your case…"
            rows={4}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fafafa', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{description.length}/1000 characters</div>
        </div>

        {/* Warning */}
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', fontSize: 12.5, color: '#92400e', marginBottom: 20, lineHeight: 1.5 }}>
          ⚠️ Raising a dispute will pause this collaboration until CollabKaro resolves it. Only raise a dispute if you've already tried to resolve it directly.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: submitting ? '#fca5a5' : 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Send size={14} /> {submitting ? 'Submitting…' : 'Raise Dispute'}
          </button>
        </div>
      </div>
    </div>
  )
}
