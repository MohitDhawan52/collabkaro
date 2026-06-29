'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Mail, Lock, User, MapPin, Building2, Globe,
  Phone, ArrowRight, ArrowLeft, Loader2, Check,
  Users, Target, BarChart3, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const INDUSTRIES = [
  'Fashion & Apparel', 'Beauty & Cosmetics', 'Food & Beverage',
  'Health & Fitness', 'Travel & Hospitality', 'Technology',
  'Finance & Fintech', 'Education', 'E-commerce',
  'Real Estate', 'Entertainment & Media', 'Other',
]

interface FormState {
  email: string; password: string; confirmPassword: string
  company_name: string; industry: string; location: string
  description: string; website: string; contact_name: string
  phone: string; terms_accepted: boolean
}

const STEPS = [
  { label: 'Account', desc: 'Create your login' },
  { label: 'Company', desc: 'Your brand details' },
  { label: 'Contact', desc: 'Confirm & agree' },
]

const BENEFITS = [
  { icon: Users, text: 'Access 10,000+ verified Indian creators' },
  { icon: Target, text: 'Find niche influencers matched to your brand' },
  { icon: BarChart3, text: 'Track campaign performance in real-time' },
  { icon: Zap, text: 'Launch campaigns in minutes, not days' },
]

export default function BrandRegisterPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    email: '', password: '', confirmPassword: '',
    company_name: '', industry: '', location: '',
    description: '', website: '', contact_name: '',
    phone: '', terms_accepted: false,
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.email || !form.password || !form.confirmPassword) { toast.error('Please fill in all fields'); return false }
      if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false }
    }
    if (step === 1) {
      if (!form.company_name || !form.industry || !form.location || !form.description) { toast.error('Please fill in all required fields'); return false }
    }
    if (step === 2) {
      if (!form.contact_name || !form.phone) { toast.error('Please add contact name and phone number'); return false }
      if (!form.terms_accepted) { toast.error('Please accept the terms to continue'); return false }
    }
    return true
  }

  function goNext() { if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function goBack() { setStep(s => Math.max(s - 1, 0)) }

  async function handleSubmit() {
    if (!validateStep()) return
    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { role: 'brand' } },
    })
    if (signUpError) { setLoading(false); toast.error(signUpError.message); return }
    if (!data.user) { setLoading(false); toast.error('Something went wrong'); return }
    if (!data.session) { setLoading(false); toast.success('Check your email to confirm, then log in.'); window.location.href = '/login'; return }
    await supabase.from('profiles').upsert({ id: data.user.id, email: form.email, role: 'brand', status: 'pending' }, { onConflict: 'id' })
    const { error: brandError } = await supabase.from('brand_profiles').insert({
      user_id: data.user.id, company_name: form.company_name,
      industry: form.industry, location: form.location,
      description: form.description, website: form.website || null,
      contact_name: form.contact_name, phone: form.phone,
      terms_accepted: true, terms_accepted_at: new Date().toISOString(),
    })
    setLoading(false)
    if (brandError) { toast.error(brandError.message); return }
    toast.success('Welcome to CollabKaro!')
    window.location.href = '/brand/pending'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0f1e', fontFamily: 'inherit' }}>
      {/* LEFT PANEL */}
      <div style={{
        display: 'none', width: '42%', flexShrink: 0, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg, #0c1445 0%, #1a237e 40%, #4a148c 70%, #1a237e 100%)',
        padding: '48px 44px', flexDirection: 'column', justifyContent: 'space-between',
      }} className="left-panel-desktop">
        <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>C</span>
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }}>CollabKaro</span>
            </div>
          </Link>

          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
              <Zap size={12} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>For Brands & Businesses</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.8 }}>
              Reach millions<br />
              through <span style={{ background: 'linear-gradient(90deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>authentic</span><br />
              creators
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>
              Partner with India's top influencers and run campaigns that actually convert.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: '#a78bfa' }} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[['500+', 'Brands'], ['10K+', 'Creators'], ['95%', 'Satisfaction']].map(([num, lbl]) => (
            <div key={lbl} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{num}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 460 }}
        >
          <div className="mobile-logo" style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>C</span>
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>CollabKaro</span>
            </Link>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px 36px 32px', backdropFilter: 'blur(20px)' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 12 }}>
                Brand Signup
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: -0.4 }}>Set up your brand</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Find and collaborate with the right creators for your campaigns</p>
            </div>

            {/* Step progress */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 28, alignItems: 'center' }}>
              {STEPS.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < STEPS.length - 1 ? 1 : undefined }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: i <= step ? 'linear-gradient(135deg,#7c3aed,#1d4ed8)' : 'rgba(255,255,255,0.08)',
                    border: i === step ? '2px solid rgba(124,58,237,0.5)' : '2px solid transparent',
                    fontSize: 12, fontWeight: 700, color: i <= step ? '#fff' : 'rgba(255,255,255,0.3)',
                    boxShadow: i === step ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                  }}>
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: i <= step ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{s.label}</span>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1.5, borderRadius: 4, background: i < step ? 'linear-gradient(90deg,#7c3aed,#1d4ed8)' : 'rgba(255,255,255,0.08)', marginLeft: 2 }} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <DarkField icon={Mail} label="Work email">
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com" style={inputStyle} />
                  </DarkField>
                  <DarkField icon={Lock} label="Password">
                    <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
                  </DarkField>
                  <DarkField icon={Lock} label="Confirm password">
                    <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Re-enter your password" style={inputStyle} />
                  </DarkField>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <DarkField icon={Building2} label="Company name">
                    <input type="text" value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Your company's name" style={inputStyle} />
                  </DarkField>
                  <div>
                    <label style={labelStyle}>Industry</label>
                    <select value={form.industry} onChange={e => update('industry', e.target.value)} style={{ ...inputStyle, paddingLeft: 14, color: form.industry ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map(n => <option key={n} value={n} style={{ color: '#000' }}>{n}</option>)}
                    </select>
                  </div>
                  <DarkField icon={MapPin} label="City / Location">
                    <input type="text" value={form.location} onChange={e => update('location', e.target.value)} placeholder="Mumbai, India" style={inputStyle} />
                  </DarkField>
                  <DarkField icon={Globe} label="Website (optional)">
                    <input type="text" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://yourcompany.com" style={inputStyle} />
                  </DarkField>
                  <div>
                    <label style={labelStyle}>About your company</label>
                    <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="What does your company do, and what campaigns are you looking to run?" rows={3} style={{ ...inputStyle, resize: 'vertical', height: 'auto', paddingTop: 12, paddingLeft: 14 }} />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <DarkField icon={User} label="Contact person name">
                    <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Full name" style={inputStyle} />
                  </DarkField>
                  <DarkField icon={Phone} label="Phone number">
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" style={inputStyle} />
                  </DarkField>

                  <div
                    onClick={() => update('terms_accepted', !form.terms_accepted)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${form.terms_accepted ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: form.terms_accepted ? 'linear-gradient(135deg,#7c3aed,#1d4ed8)' : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${form.terms_accepted ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {form.terms_accepted && <Check size={12} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                      I agree to CollabKaro's <span style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}>Terms of Service</span> and <span style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}>Privacy Policy</span>, and confirm the information provided is accurate.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {step > 0 && (
                <button onClick={goBack} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={goNext} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                  {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</> : <>Create account <ArrowRight size={15} /></>}
                </button>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
          </p>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .left-panel-desktop { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1f3a; color: #fff; }
      `}</style>
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

function DarkField({ icon: Icon, label, children }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>, label: string, children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        {children}
      </div>
    </div>
  )
}
