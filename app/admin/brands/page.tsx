'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Briefcase, CheckCircle2, XCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface BrandRow {
  id: string
  email: string
  status: string
  created_at: string
  brand_name: string
  industry: string | null
  location: string | null
  website: string | null
  contact_person: string | null
  contact_phone: string | null
  description: string | null
}

function badgeClass(status: string) {
  switch (status) {
    case 'approved': return 'dash-badge dash-badge-active'
    case 'rejected': return 'dash-badge dash-badge-rejected'
    default: return 'dash-badge dash-badge-pending'
  }
}

export default function AdminBrandsPage() {
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState<BrandRow[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const { data: profiles } = await supabase
      .from('profiles').select('id, email, status, created_at').eq('role', 'brand')

    const { data: brandProfiles } = await supabase
      .from('brand_profiles').select('user_id, brand_name, industry, location, website, contact_person, contact_phone, description')

    type BrandProfile = { user_id: string; brand_name: string; industry: string | null; location: string | null; website: string | null; contact_person: string | null; contact_phone: string | null; description: string | null }
    const brandMap: Record<string, BrandProfile> = {}
    for (const b of brandProfiles ?? []) brandMap[b.user_id] = b

    const rows: BrandRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      status: p.status,
      created_at: p.created_at,
      brand_name: brandMap[p.id]?.brand_name ?? p.email,
      industry: brandMap[p.id]?.industry ?? null,
      location: brandMap[p.id]?.location ?? null,
      website: brandMap[p.id]?.website ?? null,
      contact_person: brandMap[p.id]?.contact_person ?? null,
      contact_phone: brandMap[p.id]?.contact_phone ?? null,
      description: brandMap[p.id]?.description ?? null,
    }))

    setBrands(rows.sort((a, b) => (a.status === 'pending' ? -1 : 1)))
    setLoading(false)
  }

  async function handleAction(userId: string, action: 'approved' | 'rejected') {
    setActing(userId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ status: action }).eq('id', userId)
    if (error) toast.error('Could not update status')
    else {
      toast.success(`Brand ${action}`)
      setBrands((prev) => prev.map((b) => b.id === userId ? { ...b, status: action } : b))
    }
    setActing(null)
  }

  const filtered = brands.filter((b) => {
    const matchSearch = !search ||
      b.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || b.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="dash-page-title">Brands</div>
      <div className="dash-page-subtitle">Review and manage all brand accounts on the platform.</div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: 36 }} placeholder="Search brands..." />
        </div>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: filter === f ? 'var(--brand-primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span style={{ opacity: 0.7 }}>({f === 'all' ? brands.length : brands.filter((b) => b.status === f).length})</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 110, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Briefcase size={20} /></div>
              <div className="dash-empty-title">No brands found</div>
            </div>
          </div>
        ) : (
          filtered.map((brand) => (
            <div key={brand.id} style={{
              background: 'var(--bg-card)', border: brand.status === 'pending' ? '1.5px solid rgba(245,158,11,0.35)' : '1px solid var(--bg-border)',
              borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: '#FEF3C7', color: '#B45309',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18,
                }}>
                  {brand.brand_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="dash-row-title" style={{ fontSize: 15 }}>{brand.brand_name}</div>
                    <span className={badgeClass(brand.status)}>{brand.status}</span>
                  </div>
                  <div className="dash-row-meta" style={{ marginTop: 3 }}>
                    {brand.email}
                    {brand.industry && ` · ${brand.industry}`}
                    {brand.location && ` · ${brand.location}`}
                  </div>
                  {brand.contact_person && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      Contact: {brand.contact_person} {brand.contact_phone && `· ${brand.contact_phone}`}
                    </div>
                  )}
                  {brand.description && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                      {brand.description.slice(0, 120)}{brand.description.length > 120 ? '...' : ''}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Registered {new Date(brand.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {brand.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleAction(brand.id, 'rejected')} disabled={acting === brand.id}
                      className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13, color: '#DC2626', borderColor: '#FCA5A5' }}>
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handleAction(brand.id, 'approved')} disabled={acting === brand.id}
                      className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </div>
                )}
                {brand.status !== 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {brand.status === 'approved' && (
                      <button onClick={() => handleAction(brand.id, 'rejected')} disabled={acting === brand.id}
                        className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}>
                        Revoke
                      </button>
                    )}
                    {brand.status === 'rejected' && (
                      <button onClick={() => handleAction(brand.id, 'approved')} disabled={acting === brand.id}
                        className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}>
                        Re-approve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
