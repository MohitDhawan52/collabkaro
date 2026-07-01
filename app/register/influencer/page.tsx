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
    if (!form.niche) { toast.error('Please select your niche'); return }
    if (!form.instagram_handle && !form.youtube_handle) {
      toast.error('Please add at least one social handle'); return
    }
    if (!form.terms_accepted) { toast.error('Please accept the terms to continue'); return }

    setLoading(true)
    try {
      const supabase = createClient()

      // Step 1: Create auth user (or sign in if already exists)
      let userId: string | null = null
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { role: 'influencer' } },
      })

      if (signUpError) {
        const alreadyExists = signUpError.message.toLowerCase().includes('already registered') ||
          signUpError.message.toLowerCase().includes('already been registered') ||
          signUpError.message.toLowerCase().includes('user already')
        if (alreadyExists) {
          // Auth user exists but profile may be missing — sign in to recover
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: form.email, password: form.password,
          })
          if (signInErr) {
            toast.error('This email is already registered. Please log in or reset your password.')
            window.location.href = '/login'
            return
          }
          userId = signInData.user?.id ?? null
        } else {
          toast.error(signUpError.message)
          return
        }
      } else {
        if (!data.user) { toast.error('Could not create account'); return }
        userId = data.user.id

        // Email confirmation required
        if (!data.session) {
          // Create profile immediately so it's ready post-confirmation
          const profileBody = {
            user_id: data.user.id, email: form.email, full_name: form.full_name,
            username: form.username || null, phone: form.phone, location: form.location,
            gender: form.gender || null, bio: form.bio || null, niche: form.niche,
            instagram_handle: form.instagram_handle || null,
            youtube_handle: form.youtube_handle || null,
            followers_count: form.followers_count || null,
            instagram_post_price: form.price || null, avatar_url: null,
          }
          await Promise.race([
            fetch('/api/influencer/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileBody) }),
            new Promise(r => setTimeout(r, 8000)), // 8s timeout — don't block redirect
          ])
          toast.success('Account created! Check your email to confirm, then log in.')
          window.location.href = '/login'
          return
        }
      }

      if (!userId) { toast.error('Could not get user ID'); return }

      // Get access token to authenticate the API call
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token ?? null

      // Step 2: Create profile via server-side API (bypasses RLS)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      let res: Response
      try {
        res = await fetch('/api/influencer/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          signal: controller.signal,
          body: JSON.stringify({
            user_id: userId,
            email: form.email,
            full_name: form.full_name,
            username: form.username || null,
            phone: form.phone,
            location: form.location,
            gender: form.gender || null,
            bio: form.bio || null,
            niche: form.niche,
            instagram_handle: form.instagram_handle || null,
            youtube_handle: form.youtube_handle || null,
            followers_count: form.followers_count || null,
            instagram_post_price: form.price || null,
            avatar_url: null,
          }),
        })
      } finally {
        clearTimeout(timeout)
      }

      let json: { ok?: boolean; error?: string } = {}
      let rawText = ''
      try { rawText = await res!.text(); json = JSON.parse(rawText) } catch { /* empty body */ }
      if (!res!.ok) { toast.error(json.error ?? `Server error (${res!.status}): ${rawText.slice(0, 120)}`); return }

      toast.success('Welcome to CollabKaro! You can add your profile photo from Settings.')
      window.location.href = '/influencer/pending'
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (msg.includes('abort') || msg.includes('signal')) {
        toast.error('Request timed out. Please check your connection and try again.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '14px 0 5px', letterSpacing: -0.4 }}>Create Your Creator Profile</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Get discovered by top brands and start earning</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 24px rgba(29,78,216,0.07)', padding: '36px 40px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            {/* Profile photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div onClick={() => fileRef.current?.click()} style={{ width: 84, height: 84, borderRadius: '50%', cursor: 'pointer', border: '2px dashed #bfdbfe', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {profilePreview
                  ? <img src={profilePreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}><Camera size={22} style={{ color: '#93c5fd', display: 'block', margin: '0 auto 3px' }} /><span style={{ fontSize: 10, color: '#93c5fd', fontWeight: 600 }}>Upload Photo</span></div>
                }
              </div>
              <span style={{ fontSize: 11.5, color: '#9ca3af' }}>JPG, PNG · max 5MB</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            </div>

            <SecDivider title="Personal Info" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 22px' }}>
              <div>
                <label style={lbl}>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={iconPos} />
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Rahul Sharma" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={iconPos} />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@creator.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconPos} />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" style={inp} />
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
              <div>
                <label style={lbl}>Location *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={iconPos} />
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mumbai, India" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Gender</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => set('gender', g)} style={{ padding: '7px 13px', borderRadius: 8, border: `1.5px solid ${form.gender === g ? '#1d4ed8' : '#e5e7eb'}`, background: form.gender === g ? '#eff6ff' : '#f9fafb', color: form.gender === g ? '#1d4ed8' : '#6b7280', fontSize: 12.5, fontWeight: form.gender === g ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Bio</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell brands what you do and what you're passionate about..." rows={2} style={{ ...inp, paddingLeft: 14, resize: 'none', paddingTop: 11 }} />
              </div>
            </div>

            <SecDivider title="Creator Stats" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 22px' }}>
              {/* Niche */}
              <div>
                <label style={lbl}>Niche / Category *</label>
                <div style={{ position: 'relative' }} onBlur={() => setTimeout(() => setNicheOpen(false), 150)}>
                  <div onClick={() => setNicheOpen(o => !o)} style={{ ...inp, paddingLeft: 40, display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', color: form.niche ? '#111827' : '#9ca3af' }}>
                    <Tag size={14} style={{ position: 'absolute', left: 12, color: '#9ca3af' }} />
                    <span style={{ flex: 1 }}>{form.niche || 'Select niche'}</span>
                    <ChevronDown size={14} style={{ color: '#9ca3af', transform: nicheOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </div>
                  <AnimatePresence>
                    {nicheOpen && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                        style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}
                      >
                        {NICHES.map(n => (
                          <div key={n} onMouseDown={() => { set('niche', n); setNicheOpen(false) }}
                            style={{ padding: '10px 14px', fontSize: 13.5, color: form.niche === n ? '#1d4ed8' : '#374151', fontWeight: form.niche === n ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: form.niche === n ? '#eff6ff' : 'transparent' }}
                            onMouseEnter={e => { if (form.niche !== n) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = form.niche === n ? '#eff6ff' : 'transparent' }}
                          >
                            {n} {form.niche === n && <Check size={13} style={{ color: '#1d4ed8' }} />}
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
                  <Users size={14} style={iconPos} />
                  <input type="number" value={form.followers_count} onChange={e => set('followers_count', e.target.value)} placeholder="50000" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Price Per Post (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={14} style={iconPos} />
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5000" style={inp} />
                </div>
              </div>
            </div>

            <SecDivider title="Social Media" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 22px' }}>
              <div>
                <label style={lbl}>Instagram Handle</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={14} style={{ ...iconPos, color: '#e1306c' }} />
                  <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)} placeholder="@yourhandle" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>YouTube Channel</label>
                <div style={{ position: 'relative' }}>
                  <PlayCircle size={14} style={{ ...iconPos, color: '#ff4444' }} />
                  <input value={form.youtube_handle} onChange={e => set('youtube_handle', e.target.value)} placeholder="@yourchannel" style={inp} />
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
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Creating your profile...</> : 'Create Creator Profile →'}
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
          div[style*="gridTemplateColumns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
