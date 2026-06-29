'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

type View = 'login' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
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
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
    toast.success('Welcome back!')
    if (profileError || !profile) { window.location.href = '/' }
    else if (profile.role === 'admin') { window.location.href = '/admin/dashboard' }
    else if (profile.status === 'pending') { window.location.href = profile.role === 'brand' ? '/brand/pending' : '/influencer/pending' }
    else if (profile.status === 'rejected') { window.location.href = '/rejected' }
    else if (profile.role === 'brand') { window.location.href = '/brand/dashboard' }
    else if (profile.role === 'influencer') { window.location.href = '/influencer/dashboard' }
    else { window.location.href = '/' }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail) { toast.error('Please enter your email'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setView('forgot-sent')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', padding: '24px 16px', fontFamily: 'inherit', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#00bcd4,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>C</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.4 }}>CollabKaro</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px', backdropFilter: 'blur(20px)' }}>
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: -0.5 }}>
                    Welcome back
                  </h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Sign in to your CollabKaro dashboard</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={loading}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                      <button
                        type="button"
                        onClick={() => { setResetEmail(email); setView('forgot') }}
                        style={{ fontSize: 12, color: '#00bcd4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, fontFamily: 'inherit' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        autoComplete="current-password"
                        disabled={loading}
                        style={{ ...inputStyle, paddingLeft: 14, paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: loading ? 'rgba(0,188,212,0.4)' : 'linear-gradient(135deg,#00bcd4,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4, boxShadow: '0 4px 16px rgba(0,188,212,0.25)' }}
                  >
                    {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : <>Sign in <ArrowRight size={15} /></>}
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20, marginBottom: 0 }}>
                  New here?{' '}
                  <Link href="/register" style={{ color: '#00bcd4', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
                </p>
              </div>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 20 }}>
                Trusted by 500+ brands & creators across India
              </p>
            </motion.div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px', backdropFilter: 'blur(20px)' }}>
                <button
                  onClick={() => setView('login')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24, fontFamily: 'inherit', fontWeight: 600 }}
                >
                  <ArrowLeft size={14} /> Back to login
                </button>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Mail size={20} style={{ color: '#00bcd4' }} />
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: -0.4 }}>Reset your password</h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
                    Enter your registered email and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Email address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={loading}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: loading ? 'rgba(0,188,212,0.4)' : 'linear-gradient(135deg,#00bcd4,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,188,212,0.25)' }}
                  >
                    {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <>Send reset link <ArrowRight size={15} /></>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* SENT CONFIRMATION */}
          {view === 'forgot-sent' && (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={26} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: -0.3 }}>Check your inbox</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.6 }}>
                  We sent a password reset link to<br />
                  <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{resetEmail}</strong>
                </p>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.25)', margin: '0 0 20px' }}>
                  Didn't get it? Check spam or{' '}
                  <button onClick={() => setView('forgot')} style={{ color: '#00bcd4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
                    try again
                  </button>
                </p>
                <button
                  onClick={() => setView('login')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  <ArrowLeft size={14} /> Back to login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7,
}
