'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Briefcase, Users, IndianRupee, Calendar, CheckCircle2,
  Clock, Megaphone, Pause, Play, Star, Badge, ExternalLink, Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface Gig {
  id: string; title: string; description: string; collab_type: string
  niche_required: string[]; platforms: string[]; min_followers: number | null
  max_budget: number | null; deliverables: string | null; timeline: string | null
  influencer_limit: number | null; status: string; created_at: string
}
interface Collaboration {
  id: string; status: string; created_at: string
  influencer_profiles?: {
    full_name: string | null; instagram_handle: string | null
    niche: string | null; avatar_url: string | null; is_verified: boolean
  } | null
}
interface ParsedDeliverable { type: string; emoji: string; qty: number; due_date: string }

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [pitchCount, setPitchCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [gigRes, collabRes, pitchRes] = await Promise.all([
      supabase.from('gigs').select('*').eq('id', id).single(),
      supabase.from('collaborations').select('id, status, created_at, influencer_profiles(full_name, instagram_handle, niche, avatar_url, is_verified)').eq('gig_id', id).in('status', ['active', 'completed', 'accepted']),
      supabase.from('pitches').select('id', { count: 'exact', head: true }).eq('gig_id', id),
    ])

    setGig(gigRes.data as unknown as Gig)
    setCollabs((collabRes.data as unknown as Collaboration[]) ?? [])
    setPitchCount(pitchRes.count ?? 0)
    setLoading(false)
  }

  async function toggleStatus() {
    if (!gig) return
    const supabase = createClient()
    const next = gig.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('gigs').update({ status: next }).eq('id', gig.id)
    if (error) { toast.error(error.message); return }
    setGig(g => g ? { ...g, status: next } : g)
    toast.success(`Gig ${next === 'active' ? 'activated' : 'paused'}`)
  }

  // Parse deliverables JSON
  let parsedDeliverables: ParsedDeliverable[] = []
  if (gig?.deliverables) {
    try { parsedDeliverables = JSON.parse(gig.deliverables) } catch { /* legacy text */ }
  }

  const slotsFilled = collabs.length
  const slotsTotal = gig?.influencer_limit ?? null
  const slotsLeft = slotsTotal !== null ? slotsTotal - slotsFilled : null

  if (loading) return (
    <div>
      <div className="dash-page-title">Gig Details</div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3].map(i => <div key={i} className="dash-skel" style={{ height: 90, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  if (!gig) return (
    <div>
      <button onClick={() => router.back()} className="dash-nav-item" style={{ width: 'auto', paddingLeft: 0, marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back
      </button>
      <div className="dash-empty">
        <div className="dash-empty-icon"><Briefcase size={20} /></div>
        <div className="dash-empty-title">Gig not found</div>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Back */}
      <button onClick={() => router.push('/brand/gigs')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 20, padding: 0, fontFamily: 'inherit' }}>
        <ArrowLeft size={14} /> Back to My Gigs
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: '24px 28px', boxShadow: 'var(--shadow-card)', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.3 }}>{gig.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {gig.collab_type} · {(gig.platforms ?? []).join(', ')} · Created {fmtDate(gig.created_at)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {(gig.niche_required ?? []).map(n => <span key={n} className="badge badge-purple">{n}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {/* Status badge */}
            <span style={{ padding: '5px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: gig.status === 'active' ? '#ecfdf5' : '#fef3c7', color: gig.status === 'active' ? '#10b981' : '#f59e0b' }}>
              {gig.status === 'active' ? '● Active' : '⏸ Paused'}
            </span>
            {/* Pause/Activate */}
            <button onClick={toggleStatus} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1.5px solid var(--bg-border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {gig.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Activate</>}
            </button>
            {/* Boost button */}
            <Link href={`/brand/ads?boost=${gig.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 3px 12px rgba(245,158,11,0.3)' }}>
              <Megaphone size={14} /> Boost this Gig
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { icon: <IndianRupee size={15} />, label: 'Max Budget', value: gig.max_budget ? fmt(gig.max_budget * 0.9) : 'Barter', sub: 'Creator earns', color: '#10b981', bg: '#ecfdf5' },
          { icon: <Send size={15} />, label: 'Total Pitches', value: String(pitchCount), sub: 'Received so far', color: '#8b5cf6', bg: '#f5f3ff' },
          { icon: <Users size={15} />, label: 'Slots Filled', value: slotsTotal ? `${slotsFilled}/${slotsTotal}` : String(slotsFilled), sub: slotsLeft !== null ? `${slotsLeft} remaining` : 'No limit set', color: '#1d4ed8', bg: '#eff6ff' },
          { icon: <Calendar size={15} />, label: 'Min Followers', value: gig.min_followers ? (gig.min_followers >= 1000 ? `${(gig.min_followers/1000).toFixed(0)}K` : String(gig.min_followers)) : 'Any', sub: 'Requirement', color: '#f59e0b', bg: '#fef3c7' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Slot progress bar */}
      {slotsTotal !== null && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: '16px 20px', boxShadow: 'var(--shadow-card)', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Influencer Slots</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: slotsFilled >= slotsTotal ? '#ef4444' : '#10b981' }}>
              {slotsFilled}/{slotsTotal} filled
            </div>
          </div>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 10, background: slotsFilled >= slotsTotal ? '#ef4444' : 'linear-gradient(90deg,#6d28d9,#4f46e5)', width: `${Math.min(100, (slotsFilled / slotsTotal) * 100)}%`, transition: 'width 0.4s ease' }} />
          </div>
          {slotsFilled >= slotsTotal && (
            <div style={{ fontSize: 12.5, color: '#ef4444', fontWeight: 600, marginTop: 6 }}>All slots filled — this gig is no longer shown to influencers.</div>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Left — Gig details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>Campaign Description</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{gig.description}</div>
          </div>

          {/* Deliverables */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>Deliverables</div>
            {parsedDeliverables.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {parsedDeliverables.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--bg-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{d.emoji}</span> {d.qty}× {d.type}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Calendar size={11} /> {fmtDate(d.due_date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : gig.deliverables ? (
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{gig.deliverables}</div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No deliverables specified</div>
            )}
          </div>
        </div>

        {/* Right — Finalized Influencers */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: '#1d4ed8' }} /> Finalized Influencers
            <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: '#6b7280' }}>{collabs.length} active</span>
          </div>

          {collabs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No influencers finalized yet</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Accept pitches to start collaborations</div>
              <Link href="/brand/pitches" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '8px 16px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <Send size={13} /> View Pitches
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {collabs.map(c => {
                const inf = c.influencer_profiles as { full_name: string | null; instagram_handle: string | null; niche: string | null; avatar_url: string | null; is_verified: boolean } | null
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--bg-border)' }}>
                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {inf?.avatar_url
                        ? <img src={inf.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{(inf?.full_name ?? 'I').charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {inf?.full_name ?? 'Creator'}
                        {inf?.is_verified && (
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="#1d4ed8" />
                            <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {inf?.instagram_handle ? `@${inf.instagram_handle}` : '—'}
                        {inf?.niche ? ` · ${inf.niche}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 7, background: c.status === 'completed' ? '#ecfdf5' : '#eff6ff', color: c.status === 'completed' ? '#10b981' : '#1d4ed8' }}>
                      {c.status === 'completed' ? '✓ Done' : '● Active'}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
