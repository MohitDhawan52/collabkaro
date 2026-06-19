'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in both fields'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      const msg = typeof error.message === 'string' && error.message ? error.message : JSON.stringify(error)
      toast.error(msg === 'Invalid login credentials' ? 'Incorrect email or password' : msg)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); toast.error('Login failed'); return }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role, status').eq('id', user.id).single()

    toast.success('Welcome back!')

    if (profileError || !profile) {
      window.location.href = '/'
    } else if (profile.role === 'admin') {
      window.location.href = '/admin/dashboard'
    } else if (profile.status === 'pending') {
      window.location.href = profile.role === 'brand' ? '/brand/pending' : '/influencer/pending'
    } else if (profile.status === 'rejected') {
      window.location.href = '/rejected'
    } else if (profile.role === 'brand') {
      window.location.href = '/brand/dashboard'
    } else if (profile.role === 'influencer') {
      window.location.href = '/influencer/dashboard'
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="auth-page-dark">
      {/* Mid purple glow */}
      <div className="auth-page-dark-glow-mid" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[360px] relative z-10"
      >
        <div className="auth-card-dark p-9 sm:p-10">

          {/* Brand tag + headline */}
          <div className="mb-7">
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              padding: '4px 12px',
              borderRadius: 999,
              background: '#FF4D6D',
              color: '#fff',
              marginBottom: 16,
            }}>
              CollabKaro
            </span>
            <h1 className="font-display" style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
              margin: '0 0 6px',
            }}>
              Welcome back,<br />creator.
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Sign in to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 5,
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-dark"
                disabled={loading}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 5,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="input-dark"
                  style={{ paddingRight: 44 }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-coral w-full"
              style={{ marginTop: 4 }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in...</>
                : <>Sign in <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
            New here?{' '}
            <Link href="/register" style={{ color: '#FF4D6D', fontWeight: 500 }}>
              Create account
            </Link>
          </p>

          <div style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: '0.5px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              Trusted by 500+ brands & creators across India
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}