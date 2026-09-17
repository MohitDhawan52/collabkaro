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
      const msg = error.message ?? ''
      if (msg.toLowerCase().includes('email not confirmed')) {
        toast.error('Please confirm your email first. Check your inbox for the confirmation link.')
      } else if (msg === 'Invalid login credentials') {
        toast.error('Incorrect email or password. Use "Forgot password?" to reset.')
      } else {
        toast.error(msg || 'Login failed')
      }
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); toast.error('Login failed'); return }
    const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).maybeSingle()
    toast.success('Welcome back!')
    if (!profile) {
      // Profile row missing — send to home, middleware will handle redirect
      window.location.href = '/'
    } else if (profile.role === 'admin') { window.location.href = '/admin/dashboard' }
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
    width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
    border: '1.5px solid var(--bg-border)', background: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7,
  }
  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', pointerEvents: 'none',
  }

  const C = {
    bg: 'var(--bg-base)',
    card: 'var(--bg-card)',
    border: 'var(--bg-border)',
    primary: 'var(--brand-primary)',
    text: 'var(--text-primary)',
    muted: 'var(--text-muted)',
    secondary: 'var(--text-secondary)',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: '24px 16px', fontFamily: 'inherit' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.30)' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>C</span>
            </div>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: -0.4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>CollabKaro</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '32px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 5px', letterSpacing: -0.4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Welcome back</h1>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Sign in to your CollabKaro dashboard</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                      <button type="button" onClick={() => { setResetEmail(email); setView('forgot') }} style={{ fontSize: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, fontFamily: 'inherit' }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={iconPos} />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" autoComplete="current-password" disabled={loading} style={{ ...inp, paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: 'none', background: loading ? 'rgba(99,102,241,0.55)' : C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 2, boxShadow: '0 3px 12px rgba(99,102,241,0.25)', transition: 'all 0.15s ease' }}>
                    {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.65s linear infinite' }} /> Signing in...</> : <>Sign in <ArrowRight size={14} /></>}
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 18, marginBottom: 0 }}>
                  New here?{' '}
                  <Link href="/register" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
                </p>
              </div>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--bg-border)', marginTop: 18 }}>
                Trusted by 500+ brands &amp; creators across India
              </p>
            </motion.div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '32px', boxShadow: 'var(--shadow-card)' }}>
                <button onClick={() => setView('login')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 22, fontFamily: 'inherit', fontWeight: 600 }}>
                  <ArrowLeft size={14} /> Back to login
                </button>

                <div style={{ marginBottom: 22 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-primary-light)', border: `1px solid rgba(99,102,241,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Mail size={18} style={{ color: C.primary }} />
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 6px', letterSpacing: -0.4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Reset your password</h1>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                    Enter your registered email and we&apos;ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={lbl}>Email address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={iconPos} />
                      <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" disabled={loading} style={inp} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, border: 'none', background: loading ? 'rgba(99,102,241,0.55)' : C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 3px 12px rgba(99,102,241,0.25)' }}>
                    {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.65s linear infinite' }} /> Sending...</> : <>Send reset link <ArrowRight size={14} /></>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* SENT CONFIRMATION */}
          {view === 'forgot-sent' && (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }}>
              <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '36px 32px', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: -0.3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Check your inbox</h2>
                <p style={{ fontSize: 14, color: C.secondary, margin: '0 0 22px', lineHeight: 1.6 }}>
                  We sent a reset link to<br />
                  <strong style={{ color: C.text }}>{resetEmail}</strong>
                </p>
                <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 18px' }}>
                  Didn&apos;t get it? Check spam or{' '}
                  <button onClick={() => setView('forgot')} style={{ color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
                    try again
                  </button>
                </p>
                <button onClick={() => setView('login')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'var(--bg-input)', color: C.secondary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <ArrowLeft size={14} /> Back to login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
