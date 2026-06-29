'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'
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

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', background: '#f9fafb',
    color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7,
  }
  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: '#9ca3af', pointerEvents: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', padding: '24px 16px', fontFamily: 'inherit' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>C</span>
            </div>
            <span style={{ color: '#111827', fontWeight: 800, fontSize: 22, letterSpacing: -0.4 }}>CollabKaro</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '36px', boxShadow: '0 2px 24px rgba(29,78,216,0.07)' }}>
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.5 }}>Welcome back</h1>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sign in to your CollabKaro dashboard</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lbl}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={iconPos} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" disabled={loading} style={inp} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <label style={{ ...lbl, marginBottom: 0 }}>Password</label>
                      <button type="button" onClick={() => { setResetEmail(email); setView('forgot') }} style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, fontFamily: 'inherit' }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={iconPos} />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" autoComplete="current-password" disabled={loading} style={{ ...inp, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: '0 4px 16px rgba(29,78,216,0.22)' }}>
                    {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : <>Sign in <ArrowRight size={15} /></>}
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20, marginBottom: 0 }}>
                  New here?{' '}
                  <Link href="/register" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
                </p>
              </div>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#c4c8d4', marginTop: 20 }}>
                Trusted by 500+ brands & creators across India
              </p>
            </motion.div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '36px', boxShadow: '0 2px 24px rgba(29,78,216,0.07)' }}>
                <button onClick={() => setView('login')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24, fontFamily: 'inherit', fontWeight: 600 }}>
                  <ArrowLeft size={14} /> Back to login
                </button>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Mail size={20} style={{ color: '#1d4ed8' }} />
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.4 }}>Reset your password</h1>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                    Enter your registered email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lbl}>Email address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={iconPos} />
                      <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" disabled={loading} style={inp} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(29,78,216,0.22)' }}>
                    {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <>Send reset link <ArrowRight size={15} /></>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* SENT CONFIRMATION */}
          {view === 'forgot-sent' && (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '40px 36px', boxShadow: '0 2px 24px rgba(29,78,216,0.07)', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: '#ecfdf5', border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={26} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 10px', letterSpacing: -0.3 }}>Check your inbox</h2>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                  We sent a reset link to<br />
                  <strong style={{ color: '#111827' }}>{resetEmail}</strong>
                </p>
                <p style={{ fontSize: 12.5, color: '#c4c8d4', margin: '0 0 20px' }}>
                  Didn't get it? Check spam or{' '}
                  <button onClick={() => setView('forgot')} style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
                    try again
                  </button>
                </p>
                <button onClick={() => setView('login')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <ArrowLeft size={14} /> Back to login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        input::placeholder { color: #9ca3af !important; }
        input:focus { border-color: #1d4ed8 !important; background: #fff !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
