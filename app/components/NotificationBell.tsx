'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function typeIcon(type: string) {
  if (type === 'success') return <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
  if (type === 'warning') return <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
  if (type === 'error') return <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
  return <Info size={14} style={{ color: '#1d4ed8', flexShrink: 0 }} />
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications((data as Notification[]) ?? [])
  }

  async function markAllRead() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setLoading(false)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: open ? 'rgba(29,78,216,0.12)' : 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative',
          boxShadow: '0 2px 8px rgba(29,78,216,0.08)',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} style={{ color: '#1d4ed8' }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 999,
            background: 'linear-gradient(135deg,#ef4444,#f97316)',
            color: '#fff', fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid #fff',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown — full-width on mobile, fixed 360px on desktop */}
      {open && (
        <>
          {/* Mobile: full-screen backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 98, display: 'none' }}
            onClick={() => setOpen(false)}
            className="mob-backdrop"
          />
          <div style={{
            position: 'fixed',
            top: 60,
            right: 12,
            left: 12,
            maxWidth: 380,
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.8)',
            borderRadius: 18, boxShadow: '0 8px 32px rgba(29,78,216,0.18)',
            zIndex: 99, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0c1445', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={15} /> Notifications {unread > 0 && <span style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999 }}>{unread} new</span>}
              </div>
              {unread > 0 && (
                <button onClick={markAllRead} disabled={loading} style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <Bell size={28} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>No notifications yet</div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                      background: n.read ? 'transparent' : 'rgba(29,78,216,0.04)',
                      cursor: 'pointer', transition: 'background 0.12s',
                      display: 'flex', gap: 11, alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ marginTop: 2 }}>{typeIcon(n.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, color: '#0c1445', lineHeight: 1.3 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1d4ed8', flexShrink: 0, marginTop: 5 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
