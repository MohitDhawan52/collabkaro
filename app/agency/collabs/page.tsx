'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type CollabStatus = 'applied' | 'shortlisted' | 'active' | 'deliverable_submitted' | 'completed' | 'rejected' | 'disputed'

interface Collab {
  id: string
  status: CollabStatus
  gig_title: string
  influencer_name: string
  instagram_handle: string | null
  agreed_amount: number | null
  created_at: string
  company_name: string
}

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  applied:               { label: 'Applied',     bg: '#F3F4F6',                   color: '#6B7280' },
  shortlisted:           { label: 'Shortlisted', bg: 'rgba(245,158,11,0.12)',     color: '#B45309' },
  active:                { label: 'Active',      bg: 'rgba(5,150,105,0.10)',      color: '#059669' },
  deliverable_submitted: { label: 'Submitted',   bg: 'rgba(124,58,237,0.10)',     color: '#7C3AED' },
  completed:             { label: 'Completed',   bg: 'rgba(16,185,129,0.10)',     color: '#047857' },
  rejected:              { label: 'Rejected',    bg: 'rgba(239,68,68,0.10)',      color: '#DC2626' },
  disputed:              { label: 'Disputed',    bg: 'rgba(239,68,68,0.10)',      color: '#DC2626' },
}

export default function AgencyCollabsPage() {
  const [collabs, setCollabs] = useState<Collab[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const aid = (agency as unknown as { id: string }).id

    const { data } = await supabase
      .from('collaborations')
      .select('id, status, agreed_amount, created_at, gigs(title, brand_profiles(company_name)), influencer_profiles(full_name, instagram_handle)')
      .eq('agency_id', aid)
      .order('created_at', { ascending: false })

    if (data) {
      setCollabs((data as unknown as {
        id: string; status: CollabStatus; agreed_amount: number | null; created_at: string;
        gigs: { title: string; brand_profiles: { company_name: string } };
        influencer_profiles: { full_name: string; instagram_handle: string | null };
      }[]).map(c => ({
        id: c.id, status: c.status, agreed_amount: c.agreed_amount, created_at: c.created_at,
        gig_title: c.gigs?.title ?? '—',
        company_name: c.gigs?.brand_profiles?.company_name ?? '—',
        influencer_name: c.influencer_profiles?.full_name ?? '—',
        instagram_handle: c.influencer_profiles?.instagram_handle ?? null,
      })))
    }
    setLoading(false)
  }

  const FILTERS = ['all', 'active', 'shortlisted', 'completed', 'disputed']
  const filtered = filter === 'all' ? collabs : collabs.filter(c => c.status === filter)

  return (
    <div>
      <div className="dash-page-title">Collaborations</div>
      <div className="dash-page-subtitle">All influencer collaborations across your client campaigns.</div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: filter === f ? '1.5px solid #7C3AED' : '1.5px solid #EBEBEB', background: filter === f ? 'rgba(124,58,237,0.08)' : '#fff', color: filter === f ? '#7C3AED' : '#6B7280', transition: 'all 0.13s ease', fontFamily: 'inherit' }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ marginTop: 16 }}>{[1,2,3,4].map(i => <div key={i} className="dash-skel" style={{ height: 76, borderRadius: 14, marginBottom: 10 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Users size={24} color="#7C3AED" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111113', marginBottom: 6 }}>{filter === 'all' ? 'No collaborations yet' : `No ${filter} collaborations`}</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Collaborations appear when influencers apply to your gigs</div>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => {
            const chip = STATUS_CHIP[c.status] ?? STATUS_CHIP.applied
            return (
              <div key={c.id} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {c.influencer_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111113', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.influencer_name}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
                    {c.instagram_handle ? `@${c.instagram_handle} · ` : ''}{c.gig_title} · {c.company_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, padding: '3px 9px', background: chip.bg, color: chip.color, borderRadius: 6, fontWeight: 600, display: 'block', marginBottom: 4 }}>{chip.label}</span>
                  {c.agreed_amount && <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>₹{c.agreed_amount.toLocaleString('en-IN')}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
