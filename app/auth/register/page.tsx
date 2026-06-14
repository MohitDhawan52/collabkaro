'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role
      })

      if (role === 'influencer') router.push('/onboarding/influencer')
      else router.push('/onboarding/brand')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)'}}>
      <div className="card p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold gradient-text">CollabSphere</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">Create Account</h1>
          <p style={{color: '#9ca3af'}}>Join CollabSphere for free</p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setRole('influencer')}
            className={`p-4 rounded-xl text-center transition-all ${role === 'influencer' ? 'gradient-bg text-white' : 'text-gray-400 hover:border-purple-500'}`}
            style={role !== 'influencer' ? {background: '#1e1e2e', border: '1px solid #2a2a3a'} : {}}
          >
            <div className="text-2xl mb-1">🎭</div>
            <div className="font-semibold">Influencer</div>
            <div className="text-xs mt-1 opacity-75">I create content</div>
          </button>
          <button
            onClick={() => setRole('brand')}
            className={`p-4 rounded-xl text-center transition-all ${role === 'brand' ? 'gradient-bg text-white' : 'text-gray-400 hover:border-purple-500'}`}
            style={role !== 'brand' ? {background: '#1e1e2e', border: '1px solid #2a2a3a'} : {}}
          >
            <div className="text-2xl mb-1">🏢</div>
            <div className="font-semibold">Brand</div>
            <div className="text-xs mt-1 opacity-75">I want to advertise</div>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-400 text-sm" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: '#9ca3af'}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
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
              minLength={6}
              className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
              style={{background: '#1e1e2e', border: '1px solid #2a2a3a'}}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all mt-2"
          >
            {loading ? 'Creating account...' : `Join as ${role === 'influencer' ? 'Influencer' : 'Brand'}`}
          </button>
        </form>

        <p className="text-center mt-6" style={{color: '#9ca3af'}}>
          Already have an account?{' '}
          <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}