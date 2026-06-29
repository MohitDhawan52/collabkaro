'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirmPassword) { toast.error('Please fill in both fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setDone(true)
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', padding: '24px 16px', fontFamily: 'inherit' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>C</span>
            </div>
            <span style={{ color: '#111827', fontWeight: 800, fontSize: 22, letterSpacing: -0.4 }}>CollabKaro</span>
          </Link>
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '36px', boxShadow: '0 2px 24px rgba(29,78,216,0.07)' }}>
          {!done ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Lock size={20} style={{ color: '#1d4ed8' }} />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.4 }}>Set new password</h1>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>New password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" disabled={loading} style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Confirm new password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" disabled={loading} style={inp} />
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: '0 4px 16px rgba(29,78,216,0.22)' }}>
                  {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : <>Update password <ArrowRight size={15} /></>}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: '#ecfdf5', border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={26} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 10px', letterSpacing: -0.3 }}>Password updated!</h2>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>Your password has been changed. You can now log in with your new password.</p>
              <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(29,78,216,0.22)' }}>
                Go to login <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        input::placeholder { color: #9ca3af !important; }
        input:focus { border-color: #1d4ed8 !important; background: #fff !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
