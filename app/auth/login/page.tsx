'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        setError('Profile not found. Please contact support.')
        setLoading(false)
        return
      }

      if (profile.role === 'influencer') {
        window.location.href = '/dashboard/influencer'
      } else if (profile.role === 'brand') {
        window.location.href = '/dashboard/brand'
      } else {
        setError('Unknown role: ' + profile.role)
        setLoading(false)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)'}}>
      <div className="card p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold gradient-text">CollabSphere</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Welcome Back</h1>
          <p style={{color: '#9ca3af'}}>Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-400 text-sm" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: '#9ca3af'}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-white outline-none"
              style={{background: '#1e1e2e', border: '1px solid #2a2a3a'}}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: '#9ca3af'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl text-white outline-none"
              style={{background: '#1e1e2e', border: '1px solid #2a2a3a'}}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6" style={{color: '#9ca3af'}}>
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  )
}