'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type GigStatus = 'draft' | 'active' | 'paused' | 'closed'

interface Gig {
  id: string
  title: string
  status: GigStatus
  niche_required: string[]
  company_name: string
  created_at: string
}

const STATUS_CHIP: Record<GigStatus, { label: string; bg: string; color: string }> = {
  draft:  { label: 'Draft',  bg: '#F3F4F6', color: '#6B7280' },
  active: { label: 'Active', bg: 'rgba(5,150,105,0.10)', color: '#059669' },
  paused: { label: 'Paused', bg: 'rgba(245,158,11,0.12)', color: '#B45309' },
  closed: { label: 'Closed', bg: 'rgba(239,68,68,0.10)', color: '#DC2626' },
}

export default function AgencyGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const aid = (agency as unknown as { id: string }).id

    const { data } = await supabase
      .from('gigs')
      .select('id, title, status, niche_required, created_at, client_name')
      .eq('agency_id', aid)
      .order('created_at', { ascending: false })

    if (data) {
      setGigs((data as unknown as { id: string; title: string; status: GigStatus; niche_required: string[]; created_at: string; client_name: string | null }[])
        .map(g => ({ id: g.id, title: g.title, status: g.status, niche_required: g.niche_required ?? [], company_name: g.client_name ?? '—', created_at: g.created_at })))
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="dash-page-title" style={{ marginBottom: 0 }}>All Gigs</div>
        <Link href="/agency/gigs/new" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#FF5533', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
          <PlusCircle size={14} /> Post a Gig
        </Link>
      </div>
      <div className="dash-page-subtitle">All gigs posted across your client accounts.</div>

      {loading ? (
        <div style={{ marginTop: 20 }}>{[1,2,3,4].map(i => <div key={i} className="dash-skel" style={{ height: 68, borderRadius: 14, marginBottom: 10 }} />)}</div>
      ) : gigs.length === 0 ? (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,85,51,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Briefcase size={24} color="#FF5533" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111113', marginBottom: 6 }}>No gigs yet</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Post your first gig for a client</div>
          <Link href="/agency/gigs/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#FF5533', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
            <PlusCircle size={14} /> Post a gig
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gigs.map(g => {
            const chip = STATUS_CHIP[g.status] ?? STATUS_CHIP.draft
            return (
              <Link key={g.id} href={`/agency/gigs/${g.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '13px 18px', textDecoration: 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,85,51,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={17} color="#FF5533" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111113', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{g.company_name} · {new Date(g.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {g.niche_required.slice(0, 2).map(n => (
                    <span key={n} style={{ fontSize: 10.5, padding: '3px 8px', background: '#F3F4F6', color: '#6B7280', borderRadius: 6, fontWeight: 500 }}>{n}</span>
                  ))}
                  <span style={{ fontSize: 11, padding: '3px 9px', background: chip.bg, color: chip.color, borderRadius: 6, fontWeight: 600 }}>{chip.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
