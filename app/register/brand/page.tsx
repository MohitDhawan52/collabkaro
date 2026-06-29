'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, User, MapPin, Building2, Globe,
  Phone, Loader2, Eye, EyeOff, Camera,
  AtSign, PlayCircle, Link2, MessageCircle,
  ChevronDown, Check,
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
  phone: string; instagram: string; linkedin: string
  youtube: string; twitter: string; terms_accepted: boolean
}

export default function BrandRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [industryOpen, setIndustryOpen] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState<FormState>({
    email: '', password: '', confirmPassword: '',
    company_name: '', industry: '', location: '',
    description: '', website: '', contact_name: '',
    phone: '', instagram: '', linkedin: '',
    youtube: '', twitter: '', terms_accepted: false,
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password || !form.confirmPassword) { toast.error('Please fill in account details'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (!form.company_name || !form.industry || !form.location || !form.description) { toast.error('Please fill in company details'); return }
    if (!form.contact_name || !form.phone) { toast.error('Please add contact name and phone'); return }
    if (!form.terms_accepted) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { role: 'brand' } },
    })
    if (signUpError) { setLoading(false); toast.error(signUpError.message); return }
    if (!data.user) { setLoading(false); toast.error('Something went wrong'); return }
    if (!data.session) {
      setLoading(false)
      toast.success('Check your email to confirm, then log in.')
      window.location.href = '/login'; return
    }

    let logo_url: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${data.user.id}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, logoFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        logo_url = publicUrl
      }
    }

    await supabase.from('profiles').upsert(
      { id: data.user.id, email: form.email, role: 'brand', status: 'pending' },
      { onConflict: 'id' }
    )
    const { error: brandError } = await supabase.from('brand_profiles').insert({
      user_id: data.user.id, company_name: form.company_name,
      industry: form.industry, location: form.location,
      description: form.description, website: form.website || null,
      contact_name: form.contact_name, phone: form.phone,
      logo_url, terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    })
    setLoading(false)
    if (brandError) { toast.error(brandError.message); return }
    toast.success('Welcome to CollabKaro!')
    window.location.href = '/brand/pending'
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', background: '#f9fafb',
    color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7,
  }
  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: '#9ca3af', pointerEvents: 'none',
  }

  function SecDivider({ title }: { title: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ flex: 1, height: 1.5, background: '#f3f4f6' }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#1d4ed8', whiteSpace: 'nowrap' as const }}>{title}</span>
        <div style={{ flex: 1, height: 1.5, background: '#f3f4f6' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: 'inherit', padding: '36px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ maxWidth: 760, margin: '0 auto' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>C</span>
            </div>
            <span style={{ color: '#111827', fontWeight: 800, fontSize: 20, letterSpacing: -0.4 }}>CollabKaro</span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '14px 0 5px', letterSpacing: -0.4 }}>Set Up Your Brand</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Connect with India's top creators and launch campaigns that convert</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 24px rgba(29,78,216,0.07)', padding: '36px 40px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            {/* Logo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div onClick={() => fileRef.current?.click()} style={{ width: 84, height: 84, borderRadius: 18, cursor: 'pointer', border: '2px dashed #bfdbfe', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}><Camera size={22} style={{ color: '#93c5fd', display: 'block', margin: '0 auto 3px' }} /><span style={{ fontSize: 10, color: '#93c5fd', fontWeight: 600 }}>Upload Logo</span></div>
                }
              </div>
              <span style={{ fontSize: 11.5, color: '#9ca3af' }}>PNG, JPG · max 5MB</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
            </div>

            <SecDivider title="Account Details" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 22px' }}>
              <div>
                <label style={lbl}>Work Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={iconPos} />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iconPos} />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" style={{ ...inp, paddingRight: 42 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', maxWidth: 340 }}>
                <label style={lbl}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={iconPos} />
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter your password" style={inp} />
                </div>
              </div>
            </div>

            <SecDivider title="Company Profile" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 22px' }}>
              <div>
                <label style={lbl}>Company Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={14} style={iconPos} />
                  <input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Your company's name" style={inp} />
                </div>
              </div>

              {/* Industry custom dropdown */}
              <div>
                <label style={lbl}>Industry *</label>
                <div style={{ position: 'relative' }} onBlur={() => setTimeout(() => setIndustryOpen(false), 150)}>
                  <div onClick={() => setIndustryOpen(o => !o)} style={{ ...inp, paddingLeft: 40, display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', color: form.industry ? '#111827' : '#9ca3af' }}>
                    <Building2 size={14} style={{ position: 'absolute', left: 12, color: '#9ca3af' }} />
                    <span style={{ flex: 1 }}>{form.industry || 'Select industry'}</span>
                    <ChevronDown size={14} style={{ color: '#9ca3af', transform: industryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </div>
                  <AnimatePresence>
                    {industryOpen && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                        style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}
                      >
                        {INDUSTRIES.map(n => (
                          <div key={n} onMouseDown={() => { set('industry', n); setIndustryOpen(false) }}
                            style={{ padding: '10px 14px', fontSize: 13.5, color: form.industry === n ? '#1d4ed8' : '#374151', fontWeight: form.industry === n ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: form.industry === n ? '#eff6ff' : 'transparent' }}
                            onMouseEnter={e => { if (form.industry !== n) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = form.industry === n ? '#eff6ff' : 'transparent' }}
                          >
                            {n} {form.industry === n && <Check size={13} style={{ color: '#1d4ed8' }} />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label style={lbl}>City / Location *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={iconPos} />
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mumbai, India" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Website</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={14} style={iconPos} />
                  <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourcompany.com" style={inp} />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>About Your Company *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does your company do and what kind of influencer campaigns are you looking to run?" rows={2} style={{ ...inp, paddingLeft: 14, resize: 'none', paddingTop: 11 }} />
              </div>
            </div>

            <SecDivider title="Social Media" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 22px' }}>
              <div>
                <label style={lbl}>Instagram</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={14} style={{ ...iconPos, color: '#e1306c' }} />
                  <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/yourbrand" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>LinkedIn</label>
                <div style={{ position: 'relative' }}>
                  <Link2 size={14} style={{ ...iconPos, color: '#0a66c2' }} />
                  <input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/company/yourbrand" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>YouTube</label>
                <div style={{ position: 'relative' }}>
                  <PlayCircle size={14} style={{ ...iconPos, color: '#ff4444' }} />
                  <input value={form.youtube} onChange={e => set('youtube', e.target.value)} placeholder="https://youtube.com/c/yourbrand" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>X / Twitter</label>
                <div style={{ position: 'relative' }}>
                  <MessageCircle size={14} style={{ ...iconPos, color: '#374151' }} />
                  <input value={form.twitter} onChange={e => set('twitter', e.target.value)} placeholder="https://x.com/yourbrand" style={inp} />
                </div>
              </div>
            </div>

            <SecDivider title="Contact Details" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 22px' }}>
              <div>
                <label style={lbl}>Contact Person *</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={iconPos} />
                  <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Full name" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconPos} />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" style={inp} />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div onClick={() => set('terms_accepted', !form.terms_accepted)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px', borderRadius: 12, background: '#f9fafb', border: `1.5px solid ${form.terms_accepted ? '#1d4ed8' : '#e5e7eb'}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: form.terms_accepted ? 'linear-gradient(135deg,#1d4ed8,#06b6d4)' : '#fff', border: `1.5px solid ${form.terms_accepted ? 'transparent' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.terms_accepted && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                I agree to CollabKaro's <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Privacy Policy</span>
              </span>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 18px rgba(29,78,216,0.22)' }}>
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Setting up your brand...</> : 'Create Brand Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
        </p>
      </motion.div>

      <style>{`
        input::placeholder, textarea::placeholder { color: #9ca3af !important; }
        input:focus, textarea:focus { border-color: #1d4ed8 !important; background: #fff !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
