'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function Register() {
  const router = useRouter()
  const [role, setRole] = useState<'influencer' | 'brand'>('influencer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email, role })
      if (role === 'influencer') router.push('/onboarding/influencer')
      else router.push('/onboarding/brand')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: '800' }} className="gradient-text">CollabSphere</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="animate-scaleIn" style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>Create your account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Join CollabSphere for free</p>
          </div>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {([
              { value: 'influencer', icon: '🎭', title: 'Creator', sub: 'I create content' },
              { value: 'brand', icon: '🏢', title: 'Brand', sub: 'I want to advertise' },
            ] as const).map(r => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className="card"
                style={{
                  padding: '20px 16px', textAlign: 'center', cursor: 'pointer', border: role === r.value ? '2px solid #6c47ff' : '1px solid var(--border)',
                  background: role === r.value ? 'var(--primary-light)' : 'var(--surface)', transition: 'all 0.2s'
                }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{r.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{r.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.sub}</div>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)' }}>
              {error}
            </div>
          )}

          <div className="card" style={{ padding: '32px' }}>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '10px', marginTop: '4px' }}>
                {loading ? 'Creating account...' : `Join as ${role === 'influencer' ? 'Creator' : 'Brand'} →`}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#6c47ff', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}