'use client'

import { useEffect, useState } from 'react'
import { Star, PlusCircle, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface RosterInfluencer {
  row_id: string
  influencer_id: string
  full_name: string
  instagram_handle: string | null
  niche: string[]
  followers_count: number | null
  note: string | null
}

export default function AgencyRosterPage() {
  const [roster, setRoster] = useState<RosterInfluencer[]>([])
  const [loading, setLoading] = useState(true)
  const [agencyId, setAgencyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [addHandle, setAddHandle] = useState('')
  const [addNote, setAddNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

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
      .from('agency_roster')
      .select('id, note, influencer_profiles(id, full_name, instagram_handle, niche, followers_count)')
      .eq('agency_id', aid)
      .order('created_at', { ascending: false })

    if (data) {
      setRoster((data as unknown as { id: string; note: string | null; influencer_profiles: { id: string; full_name: string; instagram_handle: string | null; niche: string[]; followers_count: number | null } }[])
        .map(r => ({ row_id: r.id, influencer_id: r.influencer_profiles.id, full_name: r.influencer_profiles.full_name, instagram_handle: r.influencer_profiles.instagram_handle, niche: r.influencer_profiles.niche ?? [], followers_count: r.influencer_profiles.followers_count, note: r.note })))
    }
    setLoading(false)
  }

  async function addToRoster() {
    if (!addHandle.trim()) { toast.error('Enter an Instagram handle'); return }
    setAdding(true)
    const supabase = createClient()
    const handle = addHandle.replace('@', '').trim()
    const { data: inf } = await supabase.from('influencer_profiles').select('id, full_name').eq('instagram_handle', handle).single()
    if (!inf) { toast.error('No influencer found with that handle'); setAdding(false); return }
    const infData = inf as unknown as { id: string; full_name: string }

    const { error } = await supabase.from('agency_roster').insert({ agency_id: agencyId, influencer_id: infData.id, note: addNote.trim() || null })
    if (error) { toast.error('Already in roster or error adding'); setAdding(false); return }

    toast.success(`${infData.full_name} added to roster!`)
    setAddHandle(''); setAddNote(''); setShowAdd(false)
    load()
    setAdding(false)
  }

  async function removeFromRoster(rowId: string, name: string) {
    if (!confirm(`Remove ${name} from roster?`)) return
    const supabase = createClient()
    await supabase.from('agency_roster').delete().eq('id', rowId)
    setRoster(prev => prev.filter(r => r.row_id !== rowId))
    toast.success('Removed from roster')
  }

  const filtered = roster.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.instagram_handle ?? '').toLowerCase().includes(search.toLowerCase()) ||
    r.niche.some(n => n.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="dash-page-title" style={{ marginBottom: 0 }}>Influencer Roster</div>
        <button onClick={() => setShowAdd(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#7C3AED', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13.5, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <PlusCircle size={14} /> Add to Roster
        </button>
      </div>
      <div className="dash-page-subtitle">Your private shortlist of preferred influencers.</div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: '#fff', border: '1.5px solid rgba(124,58,237,0.20)', borderRadius: 14, padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111113', marginBottom: 14 }}>Add Influencer</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Instagram Handle *</label>
              <input value={addHandle} onChange={e => setAddHandle(e.target.value)} placeholder="@handle" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #EBEBEB', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Note (optional)</label>
              <input value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="e.g. Great for fashion brands" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #EBEBEB', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={addToRoster} disabled={adding} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: adding ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, handle or niche…" style={{ width: '100%', padding: '11px 14px', borderRadius: 11, border: '1.5px solid #EBEBEB', fontSize: 14, background: '#fff', outline: 'none', boxSizing: 'border-box', marginTop: 14, fontFamily: 'inherit' }} />

      {loading ? (
        <div style={{ marginTop: 14 }}>{[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 70, borderRadius: 14, marginBottom: 10 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Star size={24} color="#7C3AED" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111113', marginBottom: 6 }}>{roster.length === 0 ? 'Roster is empty' : 'No matches'}</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Add influencers you want to work with repeatedly</div>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.row_id} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                {r.full_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111113' }}>{r.full_name}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
                  {r.instagram_handle ? `@${r.instagram_handle}` : ''}
                  {r.followers_count ? ` · ${(r.followers_count / 1000).toFixed(1)}K` : ''}
                  {r.niche.slice(0, 2).map(n => ` · ${n}`)}
                </div>
                {r.note && <div style={{ fontSize: 11.5, color: '#7C3AED', marginTop: 3, fontStyle: 'italic' }}>{r.note}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {r.instagram_handle && (
                  <a href={`/brand/influencers/${r.influencer_id}`} target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.07)', border: 'none', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={13} />
                  </a>
                )}
                <button onClick={() => removeFromRoster(r.row_id, r.full_name)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
