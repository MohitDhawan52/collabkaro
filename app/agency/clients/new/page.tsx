'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AddClientPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setError('Agency profile not found'); setLoading(false); return }
    const agencyId = (agency as unknown as { id: string }).id

    // Find brand user by email
    const { data: brandUser } = await supabase.from('profiles').select('id, role').eq('email', email.trim().toLowerCase()).single()
    if (!brandUser || (brandUser as unknown as { role: string }).role !== 'brand') {
      setError('No brand account found with that email. Ask the brand to sign up at CollabKaro first.')
      setLoading(false); return
    }
    const brandUserId = (brandUser as unknown as { id: string }).id

    const { data: brandProfile } = await supabase.from('brand_profiles').select('id').eq('user_id', brandUserId).single()
    if (!brandProfile) { setError('Brand profile not found'); setLoading(false); return }
    const brandId = (brandProfile as unknown as { id: string }).id

    // Check not already linked
    const { data: existing } = await supabase.from('agency_clients').select('id').eq('agency_id', agencyId).eq('brand_id', brandId).single()
    if (existing) { setError('This brand is already linked to your agency'); setLoading(false); return }

    const { error: insertError } = await supabase.from('agency_clients').insert({ agency_id: agencyId, brand_id: brandId })
    if (insertError) { setError(insertError.message); setLoading(false); return }

    setSuccess(true)
    setTimeout(() => router.push('/agency/clients'), 1200)
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="dash-page-title">Add Client</div>
      <div className="dash-page-subtitle">Link a brand account by their registered email.</div>

      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 18, padding: '28px 24px', marginTop: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Building2 size={20} color="#7C3AED" />
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>Client linked successfully!</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Brand&apos;s Email Address <span style={{ color: '#FF5533' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="brand@company.com"
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>
              The brand must already have a CollabKaro account with role "brand".
            </div>

            {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Linking…' : 'Link Client'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
