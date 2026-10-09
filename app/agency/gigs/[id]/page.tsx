'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Briefcase, Users, IndianRupee, Calendar,
  Pause, Play, Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface Gig {
  id: string; title: string; description: string; collab_type: string
  niche_required: string[]; platforms: string[]; min_followers: number | null
  max_budget: number | null; deliverables: string | null; timeline: string | null
  influencer_limit: number | null; status: string; created_at: string
  client_name: string | null
}
interface Collab {
  id: string; status: string; created_at: string
  influencer_profiles?: {
    full_name: string | null; instagram_handle: string | null
    niche: string | null; avatar_url: string | null
  } | null
}
interface ParsedDeliverable { type: string; emoji: string; qty: number; due_date: string }

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AgencyGigDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [collabs, setCollabs] = useState<Collab[]>([])
  const [pitchCount, setPitchCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [gigRes, collabRes, pitchRes] = await Promise.all([
      supabase.from('gigs').select('*').eq('id', id).single(),
      supabase.from('collaborations').select('id, status, created_at, influencer_profiles(full_name, instagram_handle, niche, avatar_url)').eq('gig_id', id),
      supabase.from('pitches').select('id', { count: 'exact', head: true }).eq('gig_id', id),
    ])

    setGig(gigRes.data as unknown as Gig)
    setCollabs((collabRes.data as unknown as Collab[]) ?? [])
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
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 600, marginBottom: 20, padding: 0, fontFamily: 'inherit' }}>
        <ArrowLeft size={14} /> Back
      </button>
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
        <Briefcase size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
        <div style={{ fontSize: 15, fontWeight: 600 }}>Gig not found</div>
      </div>
    </div>
  )

  const STATUS_COLOR = gig.status === 'active' ? { bg: 'rgba(5,150,105,0.10)', color: '#059669' }
    : gig.status === 'paused' ? { bg: 'rgba(245,158,11,0.12)', color: '#B45309' }
    : { bg: '#F3F4F6', color: '#6B7280' }

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Back */}
      <button onClick={() => router.push('/agency/gigs')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 600, marginBottom: 20, padding: 0, fontFamily: 'inherit' }}>
        <ArrowLeft size={14} /> Back to All Gigs
      </button>

      {/* Header card */}
      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 20, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={24} color="#7C3AED" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111113', letterSpacing: -0.3, fontFamily: "'Outfit', sans-serif" }}>{gig.title}</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              {gig.client_name && <span style={{ fontWeight: 600, color: '#6B7280' }}>{gig.client_name} · </span>}
              {gig.collab_type} · {(gig.platforms ?? []).join(', ')} · Created {fmtDate(gig.created_at)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {(gig.niche_required ?? []).map(n => (
                <span key={n} style={{ fontSize: 11.5, padding: '3px 9px', background: 'rgba(124,58,237,0.08)', color: '#7C3AED', borderRadius: 99, fontWeight: 600 }}>{n}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <span style={{ padding: '5px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: STATUS_COLOR.bg, color: STATUS_COLOR.color }}>
              {gig.status === 'active' ? '● Active' : gig.status === 'paused' ? '⏸ Paused' : gig.status}
            </span>
            <button onClick={toggleStatus} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {gig.status === 'active' ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Activate</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { icon: <IndianRupee size={14} />, label: 'Budget / Influencer', value: gig.max_budget ? fmt(gig.max_budget) : 'Barter', color: '#059669', bg: 'rgba(5,150,105,0.10)' },
          { icon: <Send size={14} />, label: 'Pitches Received', value: String(pitchCount), color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
          { icon: <Users size={14} />, label: 'Slots Filled', value: slotsTotal ? `${slotsFilled}/${slotsTotal}` : String(slotsFilled), color: '#1D4ED8', bg: 'rgba(29,78,216,0.10)' },
          { icon: <Calendar size={14} />, label: 'Min Followers', value: gig.min_followers ? (gig.min_followers >= 1000 ? `${(gig.min_followers/1000).toFixed(0)}K` : String(gig.min_followers)) : 'Any', color: '#B45309', bg: 'rgba(245,158,11,0.12)' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '15px 16px' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Slot progress */}
      {slotsTotal !== null && (
        <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111113' }}>Influencer Slots</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: slotsFilled >= slotsTotal ? '#EF4444' : '#059669' }}>
              {slotsFilled}/{slotsTotal} filled · {slotsLeft} remaining
            </div>
          </div>
          <div style={{ height: 7, background: '#F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 10, background: slotsFilled >= slotsTotal ? '#EF4444' : 'linear-gradient(90deg,#7C3AED,#4F46E5)', width: `${Math.min(100, (slotsFilled / slotsTotal) * 100)}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* Two-column: description + influencers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Description */}
          <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#111113', marginBottom: 10 }}>Campaign Description</div>
            <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>{gig.description || 'No description provided.'}</div>
          </div>

          {/* Deliverables */}
          <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#111113', marginBottom: 12 }}>Deliverables</div>
            {parsedDeliverables.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {parsedDeliverables.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#FAFAF9', border: '1px solid #EBEBEB' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111113', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{d.emoji}</span> {d.qty}× {d.type}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {fmtDate(d.due_date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : gig.deliverables ? (
              <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>{gig.deliverables}</div>
            ) : (
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No deliverables specified</div>
            )}
          </div>
        </div>

        {/* Right — Collaborations */}
        <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#111113', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="#1D4ED8" /> Influencer Collaborations
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>{collabs.length} total</span>
          </div>

          {collabs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
              <Users size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>No collaborations yet</div>
              <div style={{ fontSize: 12.5 }}>Influencers will appear here once they apply</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {collabs.map(c => {
                const inf = c.influencer_profiles as { full_name: string | null; instagram_handle: string | null; niche: string | null; avatar_url: string | null } | null
                const statusChip = c.status === 'completed'
                  ? { bg: 'rgba(5,150,105,0.10)', color: '#059669', label: '✓ Done' }
                  : c.status === 'active' || c.status === 'deliverable_submitted'
                  ? { bg: 'rgba(29,78,216,0.10)', color: '#1D4ED8', label: '● Active' }
                  : { bg: '#F3F4F6', color: '#6B7280', label: c.status }
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: '#FAFAF9', border: '1px solid #EBEBEB' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>
                      {inf?.avatar_url
                        ? <img src={inf.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (inf?.full_name ?? 'I').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111113' }}>{inf?.full_name ?? 'Creator'}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>
                        {inf?.instagram_handle ? `@${inf.instagram_handle}` : '—'}
                        {inf?.niche ? ` · ${inf.niche}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7, background: statusChip.bg, color: statusChip.color, flexShrink: 0 }}>
                      {statusChip.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
