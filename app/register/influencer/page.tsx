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
      user_id: data.user.id, full_name: form.full_name, username,
      location: form.location, niche: form.niche, bio: form.bio || null,
      instagram_handle: form.instagram_handle || null,
      youtube_handle: form.youtube_handle || null,
      followers_count: form.followers_count ? parseInt(form.followers_count) : null,
      phone: form.phone, avatar_url,
      terms_accepted: true, terms_accepted_at: new Date().toISOString(),
    })
    setLoading(false)
    if (infErr) { toast.error(infErr.message); return }
    toast.success('Welcome to CollabKaro!')
    window.location.href = '/influencer/pending'
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
  }
  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
  }

  function SecDivider({ title }: { title: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', fontFamily: 'inherit', padding: '36px 16px' }}>
      {/* bg glow */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,188,212,0.07) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#00bcd4,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>C</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.4 }}>CollabKaro</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '16px 0 6px', letterSpacing: -0.5 }}>Create Your Creator Profile</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Get discovered by top brands and start earning</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 44px', backdropFilter: 'blur(20px)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Profile photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div onClick={() => fileRef.current?.click()} style={{ width: 88, height: 88, borderRadius: '50%', cursor: 'pointer', border: '2px dashed rgba(0,188,212,0.4)', background: 'rgba(0,188,212,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {profilePreview
                  ? <img src={profilePreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}><Camera size={22} style={{ color: 'rgba(0,188,212,0.6)', display: 'block', margin: '0 auto 4px' }} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Upload Photo</span></div>
                }
              </div>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.2)' }}>JPG, PNG · max 5MB</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            </div>

            <SecDivider title="Personal Info" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
              <div>
                <label style={lbl}>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={iconPos} />
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Rahul Sharma" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={iconPos} />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@creator.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={iconPos} />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={iconPos} />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" style={{ ...inp, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Location *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={iconPos} />
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mumbai, India" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Gender</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => set('gender', g)} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${form.gender === g ? '#00bcd4' : 'rgba(255,255,255,0.1)'}`, background: form.gender === g ? 'rgba(0,188,212,0.1)' : 'rgba(255,255,255,0.03)', color: form.gender === g ? '#00bcd4' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: form.gender === g ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Bio</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell brands what you do and what you're passionate about..." rows={2} style={{ ...inp, paddingLeft: 14, resize: 'none', paddingTop: 12 }} />
              </div>
            </div>

            <SecDivider title="Creator Stats" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px 24px' }}>
              {/* Niche custom dropdown */}
              <div>
                <label style={lbl}>Niche / Category *</label>
                <div style={{ position: 'relative' }} onBlur={() => setTimeout(() => setNicheOpen(false), 150)}>
                  <div onClick={() => setNicheOpen(o => !o)} style={{ ...inp, paddingLeft: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', color: form.niche ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                    <Tag size={15} style={{ position: 'absolute', left: 13, color: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ flex: 1 }}>{form.niche || 'Select niche'}</span>
                    <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', transform: nicheOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                  <AnimatePresence>
                    {nicheOpen && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                        style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#1a2035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}
                      >
                        {NICHES.map(n => (
                          <div key={n} onMouseDown={() => { set('niche', n); setNicheOpen(false) }}
                            style={{ padding: '10px 14px', fontSize: 13.5, color: form.niche === n ? '#00bcd4' : 'rgba(255,255,255,0.75)', fontWeight: form.niche === n ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: form.niche === n ? 'rgba(0,188,212,0.08)' : 'transparent' }}
                            onMouseEnter={e => { if (form.niche !== n) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = form.niche === n ? 'rgba(0,188,212,0.08)' : 'transparent' }}
                          >
                            {n} {form.niche === n && <Check size={13} style={{ color: '#00bcd4' }} />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label style={lbl}>Total Followers</label>
                <div style={{ position: 'relative' }}>
                  <Users size={15} style={iconPos} />
                  <input type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="50000" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Price Per Post (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={15} style={iconPos} />
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5000" style={inp} />
                </div>
              </div>
            </div>

            <SecDivider title="Social Media" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
              <div>
                <label style={lbl}>Instagram Handle</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={15} style={{ ...iconPos, color: '#e1306c' }} />
                  <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)} placeholder="@yourhandle" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>YouTube Channel</label>
                <div style={{ position: 'relative' }}>
                  <PlayCircle size={15} style={{ ...iconPos, color: '#ff4444' }} />
                  <input value={form.youtube_handle} onChange={e => set('youtube_handle', e.target.value)} placeholder="@yourchannel" style={inp} />
                </div>
              </div>
            </div>

            {/* Terms — simple */}
            <div onClick={() => set('terms_accepted', !form.terms_accepted)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${form.terms_accepted ? 'rgba(0,188,212,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: form.terms_accepted ? 'linear-gradient(135deg,#00bcd4,#1d4ed8)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${form.terms_accepted ? 'transparent' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.terms_accepted && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                I agree to CollabKaro's <span style={{ color: '#00bcd4' }}>Terms of Service</span> and <span style={{ color: '#00bcd4' }}>Privacy Policy</span>
              </span>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 13, border: 'none', background: loading ? 'rgba(0,188,212,0.4)' : 'linear-gradient(135deg,#00bcd4,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,188,212,0.25)', letterSpacing: 0.2 }}>
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Creating your profile...</> : 'Create Creator Profile →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#00bcd4', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
        </p>
      </motion.div>

      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25) !important; }
        input:focus, textarea:focus { border-color: rgba(0,188,212,0.5) !important; background: rgba(255,255,255,0.07) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="gridTemplateColumns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="padding: '40px 44px'"] { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}
