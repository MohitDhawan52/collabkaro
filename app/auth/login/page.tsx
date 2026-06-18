'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in both fields'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      toast.error(error.message === 'Invalid login credentials' ? 'Incorrect email or password' : error.message)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('role, status').eq('id', user!.id).single()
    toast.success('Welcome back!')
    if (!profile)                           { window.location.href = '/' }
    else if (profile.status === 'pending')  { window.location.href = profile.role === 'brand' ? '/brand/pending' : '/influencer/pending' }
    else if (profile.status === 'rejected') { window.location.href = '/rejected' }
    else if (profile.role === 'brand')      { window.location.href = '/brand/dashboard' }
    else if (profile.role === 'influencer') { window.location.href = '/influencer/dashboard' }
    else                                    { window.location.href = '/' }
  }

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="login-wrapper"
      >

        {/* ── Card ── */}
        <div className="auth-card login-card">

          {/* Header — logo + title + subtitle */}
          <div className="login-header">
            <div className="icon-badge login-badge">
              <span className="font-display" style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>C</span>
            </div>

            <h1 className="font-display login-title">CollabKaro</h1>

            <p className="login-subtitle">
              Sign in to manage your collaborations
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Email field */}
            <div className="login-field">
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input"
                disabled={loading}
              />
            </div>

            {/* Password field */}
            <div className="login-field">
              <label className="field-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="input password-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary login-submit"
            >
              {loading ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="login-divider" />

          {/* Sign up link */}
          <p className="login-footer-text">
            New to CollabKaro?{' '}
            <Link href="/register" className="login-link">
              Create an account
            </Link>
          </p>
        </div>

        {/* Below-card footnote */}
        <p className="login-footnote">
          Trusted by 500+ brands &amp; influencers across India
        </p>

      </motion.div>
    </div>
  )
}
