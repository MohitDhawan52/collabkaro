'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Building2, Globe, Phone, MapPin, Loader2, ArrowLeft, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface FormState {
  email: string; password: string; confirmPassword: string
  agency_name: string; contact_name: string; phone: string
  city: string; website: string; description: string
  gst_number: string; monthly_gigs: string; terms_accepted: boolean
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const inpNoIcon: React.CSSProperties = { ...inp, paddingLeft: 14 }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }
const iconPos: React.CSSProperties = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1.5, background: '#f3f4f6' }} />
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C3AED', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1.5, background: '#f3f4f6' }} />
    </div>
  )
}

export default function AgencyRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState<FormState>({
    email: '', password: '', confirmPassword: '',
    agency_name: '', contact_name: '', phone: '',
    city: '', website: '', description: '',
    gst_number: '', monthly_gigs: '', terms_accepted: false,
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password || !form.confirmPassword) { toast.error('Fill in all account fields'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (!form.agency_name || !form.contact_name || !form.phone) { toast.error('Agency name, contact name and phone are required'); return }
    if (!form.terms_accepted) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: 'agency' } },
    })
    if (signUpError) { setLoading(false); toast.error(signUpError.message); return }
    if (!data.user) { setLoading(false); toast.error('Something went wrong'); return }

    if (!data.session) {
      setLoading(false)
      toast.success('Check your email to confirm your account, then log in.')
      window.location.href = '/login'; return
    }

    // Create profiles row with status=pending (requires admin approval)
    await supabase.from('profiles').upsert(
      { id: data.user.id, email: form.email, role: 'agency', status: 'pending' },
      { onConflict: 'id' }
    )

    // Create agency_profiles row
    const { error: agencyError } = await supabase.from('agency_profiles').insert({
      user_id: data.user.id,
      agency_name: form.agency_name,
      contact_email: form.email,
      contact_phone: form.phone,
      website: form.website || null,
      description: form.description || null,
      gst_number: form.gst_number || null,
      city: form.city || null,
    })

    setLoading(false)
    if (agencyError) { toast.error(agencyError.message); return }

    toast.success('Application submitted! Our team will review and approve your agency within 24–48 hours.')
    window.location.href = '/agency/pending'
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '32px 16px', fontFamily: 'inherit' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, fontFamily: "'Outfit', sans-serif" }}>C</span>
            </div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 20, letterSpacing: -0.4, fontFamily: "'Outfit', sans-serif" }}>CollabKaro</span>
          </Link>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--bg-border)', borderRadius: 22, padding: '32px 28px', boxShadow: 'var(--shadow-card)' }}>
          {/* Header */}
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9CA3AF', fontWeight: 600, textDecoration: 'none', marginBottom: 22 }}>
            <ArrowLeft size={13} /> All account types
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} color="#7C3AED" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.4, fontFamily: "'Outfit', sans-serif" }}>Register as an Agency</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0' }}>Reviewed &amp; approved within 24–48 hours</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <SectionDivider title="Account" />

            <div>
              <label style={lbl}>Email *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={iconPos} />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@agency.com" autoComplete="email" style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={iconPos} />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" style={{ ...inp, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={iconPos} />
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" autoComplete="new-password" style={inp} />
                </div>
              </div>
            </div>

            <SectionDivider title="Agency Details" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Agency Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={15} style={iconPos} />
                  <input value={form.agency_name} onChange={e => set('agency_name', e.target.value)} placeholder="MonkWise Media" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Contact Person *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={iconPos} />
                  <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Rahul Gupta" style={inp} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Phone *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={iconPos} />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={iconPos} />
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" style={inp} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Website</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={15} style={iconPos} />
                  <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://agency.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>GST Number</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={15} style={iconPos} />
                  <input value={form.gst_number} onChange={e => set('gst_number', e.target.value)} placeholder="27AABCU9603R1ZX" style={inp} />
                </div>
              </div>
            </div>

            <div>
              <label style={lbl}>About Your Agency</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="What kind of campaigns do you run? Which industries do you specialize in?" style={{ ...inpNoIcon, resize: 'vertical' }} />
            </div>

            <div>
              <label style={lbl}>Estimated Monthly Gigs</label>
              <select value={form.monthly_gigs} onChange={e => set('monthly_gigs', e.target.value)} style={{ ...inpNoIcon, cursor: 'pointer' }}>
                <option value="">Select range…</option>
                <option value="1-10">1–10 gigs/month</option>
                <option value="11-35">11–35 gigs/month</option>
                <option value="36-100">36–100 gigs/month (Enterprise)</option>
                <option value="100+">100+ gigs/month (Enterprise)</option>
              </select>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.terms_accepted} onChange={e => set('terms_accepted', e.target.checked)} style={{ marginTop: 2, accentColor: '#7C3AED', width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                I agree to CollabKaro's{' '}
                <Link href="/terms" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>.
                I understand my agency account will be reviewed before activation.
              </span>
            </label>

            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 11, border: 'none', background: loading ? 'rgba(124,58,237,0.50)' : '#7C3AED', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 3px 12px rgba(124,58,237,0.28)', transition: 'all 0.15s ease', fontFamily: 'inherit', marginTop: 4 }}>
              {loading ? <><Loader2 size={15} style={{ animation: 'spin 0.65s linear infinite' }} /> Submitting…</> : 'Submit Agency Application'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
