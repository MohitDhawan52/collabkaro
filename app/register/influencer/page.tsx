'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Lock, MapPin, AtSign, PlayCircle,
  Users, IndianRupee, Tag, Loader2, Eye, EyeOff,
  Camera, ChevronDown, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { NICHES } from '@/types'

interface FormState {
  full_name: string; email: string; phone: string; password: string
  location: string; gender: string; niche: string
  followers_count: string; price: string
  instagram_handle: string; youtube_handle: string
  bio: string; username: string; terms_accepted: boolean
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export default function InfluencerRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [nicheOpen, setNicheOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState<FormState>({
    full_name: '', email: '', phone: '', password: '',
    location: '', gender: '', niche: '', followers_count: '',
    price: '', instagram_handle: '', youtube_handle: '',
    bio: '', username: '', terms_accepted: false,
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setProfileFile(f)
    setProfilePreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password || !form.phone || !form.location) {
      toast.error('Please fill in all required fields'); return
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (!form.niche) { toast.error('Please select your niche/category'); return }
    if (!form.instagram_handle && !form.youtube_handle) {
      toast.error('Please add at least one social handle'); return
    }
    if (!form.terms_accepted) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { role: 'influencer' } },
    })
    if (signUpError) { setLoading(false); toast.error(signUpError.message); return }
    if (!data.user) { setLoading(false); toast.error('Something went wrong'); return }
    if (!data.session) {
      setLoading(false)
      toast.success('Check your email to confirm, then log in.')
      window.location.href = '/login'; return
    }

    let avatar_url: string | null = null
    if (profileFile) {
      const ext = profileFile.name.split('.').pop()
      const path = `${data.user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, profileFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = publicUrl
      }
    }

    await supabase.from('profiles').upsert(
      { id: data.user.id, email: form.email, role: 'influencer', status: 'pending' },
      { onConflict: 'id' }
    )
    const username = form.username || form.full_name.toLowerCase().replace(/\s+/g, '_')
    const { error: infErr } = await supabase.from('influencer_profiles').insert({
      user_id: data.user.id,
      full_name: form.full_name,
      username,
      location: form.location,
      niche: form.niche,
      bio: form.bio || null,
      instagram_handle: form.instagram_handle || null,
      youtube_handle: form.youtube_handle || null,
      followers_count: form.followers_count ? parseInt(form.followers_count) : null,
      phone: form.phone,
      avatar_url,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    })
    setLoading(false)
    if (infErr) { toast.error(infErr.message); return }
    toast.success('Welcome to CollabKaro!')
    window.location.href = '/influencer/pending'
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', background: '#f9fafb',
    color: '#111827', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7,
  }
  const secHeader = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
      <div style={{ flex: 1, height: 1.5, background: '#f0eeff' }} />
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7c3aed', whiteSpace: 'nowrap' as const }}>{title}</span>
      <div style={{ flex: 1, height: 1.5, background: '#f0eeff' }} />
    </div>
  )
  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: '#9ca3af', pointerEvents: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', fontFamily: 'inherit', padding: '32px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ maxWidth: 860, margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>C</span>
            </div>
            <span style={{ color: '#1a1a2e', fontWeight: 800, fontSize: 22, letterSpacing: -0.4 }}>CollabKaro</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px', letterSpacing: -0.5 }}>Create Your Creator Profile</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Get discovered by top brands and start earning from collaborations</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 40px rgba(124,58,237,0.07)', padding: '40px 44px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

            {/* ── PERSONAL CREDENTIALS ── */}
            {secHeader('Personal Credentials')}

            {/* Profile picture centered */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: -16, marginBottom: 8 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ width: 100, height: 100, borderRadius: '50%', cursor: 'pointer', border: '3px dashed #c4b5fd', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
              >
                {profilePreview
                  ? <img src={profilePreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Camera size={26} style={{ color: '#a78bfa' }} />
                      <span style={{ fontSize: 10.5, color: '#a78bfa', fontWeight: 600 }}>Upload Photo</span>
                    </div>
                }
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>JPG, PNG or GIF · max 5MB</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
              {/* Full Name */}
              <div>
                <label style={lbl}>Full Name <Req /></label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={iconPos} />
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Rahul Sharma" style={inp} />
                </div>
              </div>
              {/* Email */}
              <div>
                <label style={lbl}>Email Address <Req /></label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={iconPos} />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@creator.com" style={inp} />
                </div>
              </div>
              {/* Phone */}
              <div>
                <label style={lbl}>Phone Number <Req /></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={iconPos} />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" style={inp} />
                </div>
                <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '5px 0 0' }}>Enter 10-digit number</p>
              </div>
              {/* Password */}
              <div>
                <label style={lbl}>Create Password <Req /></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={iconPos} />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="········" style={{ ...inp, paddingRight: 42 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {/* Location */}
              <div>
                <label style={lbl}>Location <Req /></label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={iconPos} />
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mumbai, India" style={inp} />
                </div>
              </div>
              {/* Gender */}
              <div>
                <label style={lbl}>Gender</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {GENDERS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set('gender', g)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${form.gender === g ? '#7c3aed' : '#e5e7eb'}`,
                        background: form.gender === g ? '#f5f3ff' : '#f9fafb',
                        color: form.gender === g ? '#7c3aed' : '#6b7280',
                        fontSize: 13, fontWeight: form.gender === g ? 700 : 500,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              {/* Bio */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Bio / About You</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell brands what you do and what you're passionate about..." rows={3} style={{ ...inp, paddingLeft: 14, resize: 'vertical', paddingTop: 12 }} />
              </div>
            </div>

            {/* ── INFLUENCE STATISTICS ── */}
            {secHeader('Influence Statistics')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px 24px', marginTop: -16 }}>
              {/* Niche — custom dropdown */}
              <div>
                <label style={lbl}>Niche / Category <Req /></label>
                <div style={{ position: 'relative' }} onBlur={() => setTimeout(() => setNicheOpen(false), 150)}>
                  <div
                    onClick={() => setNicheOpen(o => !o)}
                    style={{ ...inp, paddingLeft: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', color: form.niche ? '#111827' : '#9ca3af' }}
                  >
                    <Tag size={15} style={{ position: 'absolute', left: 12, color: '#9ca3af' }} />
                    <span style={{ flex: 1 }}>{form.niche || 'Select your niche'}</span>
                    <ChevronDown size={14} style={{ color: '#9ca3af', transform: nicheOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </div>
                  <AnimatePresence>
                    {nicheOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 240, overflowY: 'auto' }}
                      >
                        {NICHES.map(n => (
                          <div
                            key={n}
                            onMouseDown={() => { set('niche', n); setNicheOpen(false) }}
                            style={{ padding: '10px 14px', fontSize: 13.5, color: form.niche === n ? '#7c3aed' : '#374151', fontWeight: form.niche === n ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: form.niche === n ? '#faf5ff' : 'transparent' }}
                            onMouseEnter={e => { if (form.niche !== n) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = form.niche === n ? '#faf5ff' : 'transparent' }}
                          >
                            {n}
                            {form.niche === n && <Check size={13} style={{ color: '#7c3aed' }} />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '5px 0 0' }}>Choose one category</p>
              </div>
              {/* Followers */}
              <div>
                <label style={lbl}>Total Followers</label>
                <div style={{ position: 'relative' }}>
                  <Users size={15} style={iconPos} />
                  <input type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="50000" style={inp} />
                </div>
              </div>
              {/* Price */}
              <div>
                <label style={lbl}>Price Per Post (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={15} style={iconPos} />
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5000" style={inp} />
                </div>
              </div>
            </div>

            {/* ── SOCIAL MEDIA PRESENCE ── */}
            {secHeader('Social Media Presence')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginTop: -16 }}>
              <div>
                <label style={lbl}>Instagram Link</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={15} style={{ ...iconPos, color: '#e1306c' }} />
                  <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)} placeholder="https://instagram.com/user" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>YouTube Link</label>
                <div style={{ position: 'relative' }}>
                  <PlayCircle size={15} style={{ ...iconPos, color: '#ff0000' }} />
                  <input value={form.youtube_handle} onChange={e => set('youtube_handle', e.target.value)} placeholder="https://youtube.com/c/user" style={inp} />
                </div>
                <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '5px 0 0' }}>Optional</p>
              </div>
            </div>

            {/* Payout notice */}
            <div style={{ padding: '16px 20px', borderRadius: 14, background: '#faf5ff', border: '1.5px solid #e9d5ff' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>💰 Payout Policy</div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#4b5563', lineHeight: 1.8 }}>
                <li>Earnings released <strong>once a month on the 20th</strong></li>
                <li><strong>KYC verification</strong> (PAN + Aadhaar) required before your first payout</li>
                <li>All completed collabs in the cycle bundled into one payout</li>
              </ul>
            </div>

            {/* Terms */}
            <div
              onClick={() => set('terms_accepted', !form.terms_accepted)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', borderRadius: 12, background: '#fafafa', border: `1.5px solid ${form.terms_accepted ? '#7c3aed' : '#e5e7eb'}` }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: form.terms_accepted ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#fff', border: `1.5px solid ${form.terms_accepted ? 'transparent' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.terms_accepted && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 }}>
                I agree to CollabKaro's <span style={{ color: '#7c3aed', textDecoration: 'underline' }}>Terms of Service</span> and <span style={{ color: '#7c3aed', textDecoration: 'underline' }}>Privacy Policy</span>, confirm the information is accurate, and understand that payouts are processed on the 20th of every month. By accepting, I acknowledge all clauses including clause 8.3 (Platform Facilitation Margin), clause 11.2 (Settlement Timelines), and clause 14.7 (Fee Structures applicable to Collaboration payouts as determined solely by CollabKaro at its discretion from time to time).
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 24px rgba(124,58,237,0.25)', letterSpacing: 0.2 }}
            >
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating your profile...</> : 'Create Creator Profile →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
        </p>
      </motion.div>

      <style>{`
        input::placeholder, textarea::placeholder { color: #9ca3af !important; }
        input:focus, textarea:focus { border-color: #7c3aed !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: 1fr 1fr"]:not([data-no-collapse]) { grid-template-columns: 1fr !important; }
          div[style*="gridTemplateColumns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function Req() {
  return <span style={{ color: '#ef4444' }}>*</span>
}
