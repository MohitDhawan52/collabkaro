'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Trash2, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  added_at: string
}

const ROLE_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  admin:   { label: 'Admin',   bg: 'rgba(124,58,237,0.10)', color: '#7C3AED' },
  manager: { label: 'Manager', bg: 'rgba(245,158,11,0.12)', color: '#B45309' },
  viewer:  { label: 'Viewer',  bg: '#F3F4F6',               color: '#6B7280' },
}

export default function AgencyTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [agencyId, setAgencyId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'viewer'>('manager')
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const aid = (agency as unknown as { id: string }).id
    setAgencyId(aid)

    const { data } = await supabase.from('agency_team_members').select('*').eq('agency_id', aid).order('created_at', { ascending: true })
    if (data) setMembers((data as unknown as { id: string; name: string; email: string; role: 'admin' | 'manager' | 'viewer'; created_at: string }[]).map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role, added_at: m.created_at })))
    setLoading(false)
  }

  async function addMember() {
    if (!newName.trim() || !newEmail.trim()) { toast.error('Name and email are required'); return }
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from('agency_team_members').insert({ agency_id: agencyId, name: newName.trim(), email: newEmail.trim().toLowerCase(), role: newRole })
    if (error) { toast.error(error.message); setAdding(false); return }
    toast.success(`${newName} added to team!`)
    setNewName(''); setNewEmail(''); setNewRole('manager'); setShowAdd(false)
    load()
    setAdding(false)
  }

  async function removeMember(id: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return
    const supabase = createClient()
    await supabase.from('agency_team_members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
    toast.success('Team member removed')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="dash-page-title" style={{ marginBottom: 0 }}>Team Members</div>
        <button onClick={() => setShowAdd(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#7C3AED', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13.5, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <UserPlus size={14} /> Add Member
        </button>
      </div>
      <div className="dash-page-subtitle">Manage who can access and operate the agency panel.</div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1.5px solid rgba(124,58,237,0.20)', borderRadius: 14, padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111113', marginBottom: 14 }}>Add Team Member</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Full Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Priya Sharma" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #EBEBEB', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Email *</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="priya@agency.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #EBEBEB', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 7, display: 'block' }}>Role</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['admin', 'manager', 'viewer'] as const).map(r => (
                <label key={r} style={{ flex: 1, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, border: newRole === r ? '2px solid #7C3AED' : '1.5px solid #EBEBEB', background: newRole === r ? 'rgba(124,58,237,0.06)' : '#FAFAF9', color: newRole === r ? '#7C3AED' : '#6B7280', transition: 'all 0.13s ease' }}>
                  <input type="radio" value={r} checked={newRole === r} onChange={() => setNewRole(r)} style={{ display: 'none' }} />
                  {r === 'admin' && '👑 Admin'}
                  {r === 'manager' && '⚡ Manager'}
                  {r === 'viewer' && '👁 Viewer'}
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>
              {newRole === 'admin' && 'Full access — can manage clients, post gigs, and add team members.'}
              {newRole === 'manager' && 'Can post gigs and view reports, but cannot manage team members.'}
              {newRole === 'viewer' && 'Read-only access to campaigns and reports.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={addMember} disabled={adding} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: adding ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {adding ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 16 }}>{[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 68, borderRadius: 14, marginBottom: 10 }} />)}</div>
      ) : members.length === 0 ? (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Shield size={24} color="#7C3AED" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111113', marginBottom: 6 }}>No team members yet</div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Add colleagues to collaborate on campaigns</div>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(m => {
            const chip = ROLE_CHIP[m.role]
            return (
              <div key={m.id} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#7C3AED', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111113' }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{m.email}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 9px', background: chip.bg, color: chip.color, borderRadius: 6, fontWeight: 600, flexShrink: 0 }}>{chip.label}</span>
                <button onClick={() => removeMember(m.id, m.name)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
