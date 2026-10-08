'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, PlusCircle, Briefcase, ArrowRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Client {
  id: string
  brand_id: string
  company_name: string
  industry: string | null
  gig_count: number
}

export default function AgencyClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [agencyId, setAgencyId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const aid = (agency as unknown as { id: string }).id
    setAgencyId(aid)

    const { data } = await supabase
      .from('agency_clients')
      .select('id, brand_profiles(id, company_name, industry)')
      .eq('agency_id', aid)

    if (data) {
      const rows = data as unknown as { id: string; brand_profiles: { id: string; company_name: string; industry: string | null } }[]
      const brandIds = rows.map(r => r.brand_profiles.id)
      const gigCounts: Record<string, number> = {}
      if (brandIds.length > 0) {
        const { data: gigs } = await supabase.from('gigs').select('brand_id').in('brand_id', brandIds)
        for (const g of gigs ?? []) gigCounts[(g as unknown as { brand_id: string }).brand_id] = (gigCounts[(g as unknown as { brand_id: string }).brand_id] ?? 0) + 1
      }
      setClients(rows.map(r => ({ id: r.id, brand_id: r.brand_profiles.id, company_name: r.brand_profiles.company_name, industry: r.brand_profiles.industry, gig_count: gigCounts[r.brand_profiles.id] ?? 0 })))
    }
    setLoading(false)
  }

  async function removeClient(clientRowId: string) {
    if (!confirm('Remove this client from your agency?')) return
    const supabase = createClient()
    await supabase.from('agency_clients').delete().eq('id', clientRowId)
    setClients(prev => prev.filter(c => c.id !== clientRowId))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="dash-page-title" style={{ marginBottom: 0 }}>My Clients</div>
        <Link href="/agency/clients/new" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#7C3AED', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13.5, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
          <PlusCircle size={14} /> Add Client
        </Link>
      </div>
      <div className="dash-page-subtitle">Brand accounts you manage on their behalf.</div>

      {loading ? (
        <div style={{ marginTop: 20 }}>{[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 72, borderRadius: 14, marginBottom: 10 }} />)}</div>
      ) : clients.length === 0 ? (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Building2 size={24} color="#7C3AED" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111113', marginBottom: 6 }}>No clients yet</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Link brand accounts to start managing campaigns</div>
          <Link href="/agency/clients/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#7C3AED', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
            <PlusCircle size={14} /> Add first client
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                {c.company_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111113' }}>{c.company_name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{c.industry ?? 'No industry'} · {c.gig_count} gig{c.gig_count !== 1 ? 's' : ''}</div>
              </div>
              <Link href={`/agency/gigs/new?brand_id=${c.brand_id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(255,85,51,0.08)', color: '#FF5533', borderRadius: 8, fontWeight: 600, fontSize: 12.5, textDecoration: 'none' }}>
                <Briefcase size={12} /> Post Gig
              </Link>
              <button onClick={() => removeClient(c.id)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
