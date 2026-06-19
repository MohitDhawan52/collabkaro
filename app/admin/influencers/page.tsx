'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Users, CheckCircle2, XCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface InfluencerRow {
  id: string
  email: string
  status: string
  created_at: string
  full_name: string
  niche: string[]
  location: string | null
  instagram_handle: string | null
  instagram_followers: number | null
  youtube_channel: string | null
  youtube_subscribers: number | null
  barter_open: boolean
}

function badgeClass(status: string) {
  switch (status) {
    case 'approved': return 'dash-badge dash-badge-active'
    case 'rejected': return 'dash-badge dash-badge-rejected'
    default: return 'dash-badge dash-badge-pending'
  }
}

function formatNumber(n: number | null | undefined) {
  if (!n) return null
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

export default function AdminInfluencersPage() {
  const [loading, setLoading] = useState(true)
  const [influencers, setInfluencers] = useState<InfluencerRow[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const { data: profiles } = await supabase
      .from('profiles').select('id, email, status, created_at').eq('role', 'influencer')

    const { data: infProfiles } = await supabase
      .from('influencer_profiles').select('user_id, full_name, niche, location, instagram_handle, instagram_followers, youtube_channel, youtube_subscribers, barter_open')

    type InfProfile = { user_id: string; full_name: string; niche: string[]; location: string | null; instagram_handle: string | null; instagram_followers: number | null; youtube_channel: string | null; youtube_subscribers: number | null; barter_open: boolean }
    const infMap: Record<string, InfProfile> = {}
    for (const i of infProfiles ?? []) infMap[i.user_id] = i

    const rows: InfluencerRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      status: p.status,
      created_at: p.created_at,
      full_name: infMap[p.id]?.full_name ?? p.email,
      niche: infMap[p.id]?.niche ?? [],
      location: infMap[p.id]?.location ?? null,
      instagram_handle: infMap[p.id]?.instagram_handle ?? null,
      instagram_followers: infMap[p.id]?.instagram_followers ?? null,
      youtube_channel: infMap[p.id]?.youtube_channel ?? null,
      youtube_subscribers: infMap[p.id]?.youtube_subscribers ?? null,
      barter_open: infMap[p.id]?.barter_open ?? false,
    }))

    setInfluencers(rows.sort((a, b) => (a.status === 'pending' ? -1 : 1)))
    setLoading(false)
  }

  async function handleAction(userId: string, action: 'approved' | 'rejected') {
    setActing(userId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ status: action }).eq('id', userId)
    if (error) toast.error('Could not update status')
    else {
      toast.success(`Influencer ${action}`)
      setInfluencers((prev) => prev.map((i) => i.id === userId ? { ...i, status: action } : i))
    }
    setActing(null)
  }

  const filtered = influencers.filter((i) => {
    const matchSearch = !search ||
      i.full_name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      (i.instagram_handle ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || i.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="dash-page-title">Influencers</div>
      <div className="dash-page-subtitle">Review and manage all creator accounts on the platform.</div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: 36 }} placeholder="Search influencers..." />
        </div>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: filter === f ? 'var(--brand-primary)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span style={{ opacity: 0.7 }}>({f === 'all' ? influencers.length : influencers.filter((i) => i.status === f).length})</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 110, borderRadius: 16 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Users size={20} /></div>
              <div className="dash-empty-title">No influencers found</div>
            </div>
          </div>
        ) : (
          filtered.map((inf) => (
            <div key={inf.id} style={{
              background: 'var(--bg-card)', border: inf.status === 'pending' ? '1.5px solid rgba(245,158,11,0.35)' : '1px solid var(--bg-border)',
              borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(109,40,217,0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18,
                }}>
                  {inf.full_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="dash-row-title" style={{ fontSize: 15 }}>{inf.full_name}</div>
                    <span className={badgeClass(inf.status)}>{inf.status}</span>
                  </div>
                  <div className="dash-row-meta" style={{ marginTop: 3 }}>
                    {inf.email}
                    {inf.location && ` · ${inf.location}`}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {inf.instagram_handle && (
                      <span>@{inf.instagram_handle} {inf.instagram_followers && `· ${formatNumber(inf.instagram_followers)} followers`}</span>
                    )}
                    {inf.youtube_channel && (
                      <span>YT: {inf.youtube_channel} {inf.youtube_subscribers && `· ${formatNumber(inf.youtube_subscribers)} subs`}</span>
                    )}
                    {inf.barter_open && <span className="badge badge-gray">Open to barter</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                    {inf.niche.slice(0, 4).map((n) => <span key={n} className="badge badge-purple">{n}</span>)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Registered {new Date(inf.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {inf.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleAction(inf.id, 'rejected')} disabled={acting === inf.id}
                      className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13, color: '#DC2626', borderColor: '#FCA5A5' }}>
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handleAction(inf.id, 'approved')} disabled={acting === inf.id}
                      className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                      <CheckCircle2 size={14} /> Approve
                    </button>
                  </div>
                )}
                {inf.status !== 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {inf.status === 'approved' && (
                      <button onClick={() => handleAction(inf.id, 'rejected')} disabled={acting === inf.id}
                        className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}>
                        Revoke
                      </button>
                    )}
                    {inf.status === 'rejected' && (
                      <button onClick={() => handleAction(inf.id, 'approved')} disabled={acting === inf.id}
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
