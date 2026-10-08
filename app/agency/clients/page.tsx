'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface Client {
  id: string; company_name: string; contact_name: string | null
  contact_email: string | null; contact_phone: string | null
  industry: string | null; city: string | null
}

export default function AgencyClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const { data } = await supabase.from('agency_manual_clients').select('*').eq('agency_id', (agency as unknown as { id: string }).id).order('created_at', { ascending: false })
    setClients((data ?? []) as Client[])
    setLoading(false)
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name} from your clients?`)) return
    const supabase = createClient()
    await supabase.from('agency_manual_clients').delete().eq('id', id)
    toast.success(`${name} removed`)
    setClients(p => p.filter(c => c.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div className="dash-page-title">Clients</div>
          <div className="dash-page-subtitle">All brand clients you manage.</div>
        </div>
        <Link href="/agency/clients/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#7C3AED', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 13.5, fontWeight: 700, boxShadow: '0 2px 10px rgba(124,58,237,0.28)' }}>
          <Plus size={14} /> Add Client
        </Link>
      </div>

      {loading ? (
        <div style={{ marginTop: 24 }}>{[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 72, borderRadius: 14, marginBottom: 10 }} />)}</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <Building2 size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>No clients yet</div>
          <Link href="/agency/clients/new" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none', fontSize: 13.5 }}>Add your first client →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {clients.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                {c.company_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111113' }}>{c.company_name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 4 }}>
                  {c.contact_name && <span style={{ fontSize: 12.5, color: '#6B7280' }}>{c.contact_name}</span>}
                  {c.industry && <span style={{ fontSize: 12, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 8px', borderRadius: 99 }}>{c.industry}</span>}
                  {c.city && <span style={{ fontSize: 12.5, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{c.city}</span>}
                  {c.contact_phone && <span style={{ fontSize: 12.5, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={11} />{c.contact_phone}</span>}
                  {c.contact_email && <span style={{ fontSize: 12.5, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{c.contact_email}</span>}
                </div>
              </div>
              <button onClick={() => remove(c.id, c.company_name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 6, borderRadius: 8, display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
