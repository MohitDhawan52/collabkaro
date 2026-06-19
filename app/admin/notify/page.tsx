'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Send, Users, Briefcase, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', icon: <Users size={15} />, desc: 'Every brand and influencer on the platform' },
  { value: 'brand', label: 'All Brands', icon: <Briefcase size={15} />, desc: 'Every approved brand account' },
  { value: 'influencer', label: 'All Influencers', icon: <Bell size={15} />, desc: 'Every approved influencer account' },
  { value: 'pending', label: 'Pending Accounts', icon: <ShieldCheck size={15} />, desc: 'Users waiting for approval' },
]

export default function AdminNotifyPage() {
  const [audience, setAudience] = useState('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<null | { count: number }>(null)

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error('Fill in title and message')
      return
    }
    setSending(true)
    const supabase = createClient()

    // Get target user IDs
    let query = supabase.from('profiles').select('id')
    if (audience === 'brand') query = query.eq('role', 'brand').eq('status', 'approved')
    else if (audience === 'influencer') query = query.eq('role', 'influencer').eq('status', 'approved')
    else if (audience === 'pending') query = query.eq('status', 'pending')
    else query = query.neq('role', 'admin')

    const { data: targets, error: fetchError } = await query
    if (fetchError) { toast.error('Failed to fetch users'); setSending(false); return }

    const rows = (targets ?? []).map((t) => ({
      user_id: t.id,
      title,
      message,
      type,
      read: false,
    }))

    if (rows.length === 0) {
      toast.info('No users match this audience')
      setSending(false)
      return
    }

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) {
      toast.error('Failed to send: ' + error.message)
    } else {
      toast.success(`Sent to ${rows.length} users`)
      setSent({ count: rows.length })
      setTitle('')
      setMessage('')
    }
    setSending(false)
  }

  return (
    <div>
      <div className="dash-page-title">Send Notifications</div>
      <div className="dash-page-subtitle">Broadcast messages to brands, influencers, or all users.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24, maxWidth: 900 }}>
        {/* Form */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
          borderRadius: 20, padding: '24px', boxShadow: 'var(--shadow-card)',
          gridColumn: 'span 2',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20 }}>Compose Notification</div>

          {/* Audience */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Audience</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {AUDIENCE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setAudience(opt.value)} style={{
                  padding: '12px 14px', borderRadius: 14, border: audience === opt.value ? '2px solid var(--brand-primary)' : '1.5px solid var(--bg-border)',
                  background: audience === opt.value ? 'rgba(109,40,217,0.06)' : 'var(--bg-elevated)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: audience === opt.value ? 'var(--brand-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                    {opt.icon} {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Notification Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['info', 'success', 'warning', 'error'] as const).map((t) => {
                const colors: Record<string, string> = { info: '#0369A1', success: '#15803D', warning: '#B45309', error: '#DC2626' }
                return (
                  <button key={t} onClick={() => setType(t)} style={{
                    padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: type === t ? `2px solid ${colors[t]}` : '1.5px solid var(--bg-border)',
                    background: type === t ? `${colors[t]}18` : 'var(--bg-elevated)',
                    color: type === t ? colors[t] : 'var(--text-secondary)',
                    transition: 'all 0.15s ease', textTransform: 'capitalize',
                  }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="input" placeholder="e.g. Platform Update"
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              className="input" rows={4} placeholder="Write your message here..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={handleSend} disabled={sending} className="btn btn-primary" style={{ gap: 8 }}>
              <Send size={14} /> {sending ? 'Sending...' : 'Send Notification'}
            </button>
            {sent && (
              <span style={{ fontSize: 13, color: '#15803D', fontWeight: 500 }}>
                ✓ Sent to {sent.count} users
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{
        background: 'rgba(109,40,217,0.04)', border: '1px solid rgba(109,40,217,0.15)',
        borderRadius: 16, padding: '14px 18px', marginTop: 16, maxWidth: 900,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--brand-primary)' }}>How it works:</strong> Notifications are sent to users' notification inbox in their dashboard. Users see a bell icon with unread count. You can send announcements, approval notices, platform updates, or reminders.
        </div>
      </div>
    </div>
  )
}
