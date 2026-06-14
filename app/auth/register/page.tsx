'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [role, setRole] = useState<'brand' | 'influencer'>('brand')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/onboarding/${role}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #9f67ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white', fontWeight: 800, fontSize: 20 }}>C</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1d23', marginBottom: 4 }}>Create your account</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Join CollabSphere for free — no credit card needed</p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)' }}>
          {/* Role toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f0f2f7', borderRadius: 10, padding: 4 }}>
            {(['brand', 'influencer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  background: role === r ? '#fff' : 'transparent',
                  color: role === r ? '#7c3aed' : '#6b7280',
                  boxShadow: role === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >{r === 'brand' ? '🏢 Brand' : '⭐ Influencer'}</button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#1a1d23', outline: 'none', background: '#fafafa' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#1a1d23', outline: 'none', background: '#fafafa' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 8, background: loading ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating account…' : `Create ${role} account →`}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}