'use client'

import { useEffect, useState } from 'react'
import { Clock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AgencyPendingPage() {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase.from('agency_profiles').select('agency_name').eq('user_id', user.id).single()
      setName((data as unknown as { agency_name?: string })?.agency_name ?? null)
    }
    load()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3', padding: 24 }}>
      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 24, padding: '48px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Clock size={28} color="#7C3AED" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
          {name ? `Thanks, ${name}!` : 'Account created!'}
        </div>
        <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
          Your agency profile is under review. Our team verifies every agency before activation — usually within 24–48 hours. We'll email you once you're approved.
        </p>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </main>
  )
}
