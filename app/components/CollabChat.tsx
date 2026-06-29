'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/sendEmail'
import { newMessageEmail } from '@/lib/emailTemplates'

interface Message {
  id: string
  collab_id: string
  sender_id: string
  sender_name: string
  sender_role: 'brand' | 'influencer'
  content: string
  read_by_brand: boolean
  read_by_influencer: boolean
  created_at: string
}

interface Props {
  collabId: string
  myRole: 'brand' | 'influencer'
  myName: string
  otherPartyUserId?: string
  gigTitle?: string
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function CollabChat({ collabId, myRole, myName, otherPartyUserId, gigTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const unread = messages.filter(m =>
    m.sender_role !== myRole &&
    (myRole === 'brand' ? !m.read_by_brand : !m.read_by_influencer)
  ).length

  // Get current user id once
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  // Load messages + subscribe to realtime
  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('collab_id', collabId)
        .order('created_at', { ascending: true })
      setMessages((data as Message[]) ?? [])
    }

    load()

    const channel = supabase
      .channel(`chat:${collabId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `collab_id=eq.${collabId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [collabId])

  // Auto-scroll when open or new message
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [open, messages.length])

  // Mark unread as read when chat opens
  useEffect(() => {
    if (!open || unread === 0) return
    const supabase = createClient()
    const col = myRole === 'brand' ? 'read_by_brand' : 'read_by_influencer'
    supabase.from('messages')
      .update({ [col]: true })
      .eq('collab_id', collabId)
      .eq(col, false)
      .neq('sender_role', myRole)
      .then(() => {
        setMessages(prev => prev.map(m =>
          m.sender_role !== myRole ? { ...m, [col]: true } : m
        ))
      })
  }, [open, collabId, myRole, unread])

  async function send() {
    const text = input.trim()
    if (!text || !userId) return
    setSending(true)
    setInput('')
    const supabase = createClient()
    await supabase.from('messages').insert({
      collab_id: collabId,
      sender_id: userId,
      sender_name: myName,
      sender_role: myRole,
      content: text,
      read_by_brand: myRole === 'brand',
      read_by_influencer: myRole === 'influencer',
    })
    // Email the other party (fire-and-forget, don't block UI)
    if (otherPartyUserId && gigTitle) {
      const { subject, html } = newMessageEmail('', myName, gigTitle, text)
      sendEmail(otherPartyUserId, subject, html)
    }
    setSending(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600,
          color: open ? '#1d4ed8' : '#374151',
          background: open ? 'rgba(29,78,216,0.07)' : 'rgba(0,0,0,0.04)',
          border: open ? '1px solid rgba(29,78,216,0.2)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
          position: 'relative', transition: 'all 0.15s',
        }}
      >
        <MessageCircle size={14} />
        {open ? 'Close Chat' : 'Chat'}
        {!open && unread > 0 && (
          <span style={{
            background: 'linear-gradient(135deg,#ef4444,#f97316)',
            color: '#fff', fontSize: 10, fontWeight: 800,
            minWidth: 18, height: 18, borderRadius: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>{unread}</span>
        )}
        {open ? <X size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          marginTop: 12,
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: 16,
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Messages */}
          <div style={{
            height: 280,
            overflowY: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
                <MessageCircle size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                No messages yet. Say hello!
              </div>
            ) : (
              messages.map(m => {
                const isMine = m.sender_role === myRole
                return (
                  <div key={m.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                  }}>
                    {/* Name + time */}
                    <div style={{ fontSize: 10.5, color: '#9ca3af', marginBottom: 3, paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                      {isMine ? 'You' : m.sender_name} · {timeLabel(m.created_at)}
                    </div>
                    {/* Bubble */}
                    <div style={{
                      maxWidth: '78%',
                      padding: '9px 14px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine
                        ? 'linear-gradient(135deg, #1d4ed8, #06b6d4)'
                        : 'rgba(255,255,255,0.85)',
                      color: isMine ? '#fff' : '#1f2937',
                      fontSize: 13,
                      lineHeight: 1.5,
                      boxShadow: isMine
                        ? '0 2px 10px rgba(29,78,216,0.2)'
                        : '0 1px 4px rgba(0,0,0,0.08)',
                      border: isMine ? 'none' : '1px solid rgba(0,0,0,0.07)',
                      wordBreak: 'break-word',
                    }}>
                      {m.content}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            background: 'rgba(255,255,255,0.6)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.9)',
                fontSize: 13,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 100,
                overflowY: 'auto',
              }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: input.trim() ? 'linear-gradient(135deg,#1d4ed8,#06b6d4)' : 'rgba(0,0,0,0.08)',
                border: 'none',
                color: input.trim() ? '#fff' : '#9ca3af',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
                boxShadow: input.trim() ? '0 2px 8px rgba(29,78,216,0.3)' : 'none',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
