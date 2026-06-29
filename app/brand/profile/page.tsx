'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Save, Globe, Phone, User, MapPin, Camera, AtSign, Link2, PlayCircle, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const INDUSTRIES = [
  'Fashion & Apparel', 'Beauty & Cosmetics', 'Food & Beverage',
  'Health & Fitness', 'Travel & Hospitality', 'Technology',
  'Finance & Fintech', 'Education', 'E-commerce',
  'Real Estate', 'Entertainment & Media', 'Other',
]

const schema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  website: z.string().optional(),
  industry: z.string().min(1, 'Please select an industry'),
  description: z.string().min(10, 'Please add a short description'),
  location: z.string().min(2, 'Location is required'),
  contact_name: z.string().min(2, 'Contact name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  twitter: z.string().optional(),
})

type ProfileForm = z.infer<typeof schema>

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 4px' }}>
      <div style={{ flex: 1, height: 1.5, background: 'var(--bg-border)' }} />
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#1d4ed8', whiteSpace: 'nowrap' as const }}>{title}</span>
      <div style={{ flex: 1, height: 1.5, background: 'var(--bg-border)' }} />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: '26px 28px', boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
      {children}
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }
const errStyle: React.CSSProperties = { fontSize: 12, color: '#DC2626', marginTop: 5, display: 'block' }

export default function BrandProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase.from('brand_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setCurrentLogo(data.logo_url ?? null)
        reset({
          company_name: data.company_name ?? data.brand_name ?? '',
          website: data.website ?? '',
          industry: data.industry ?? '',
          description: data.description ?? '',
          location: data.location ?? '',
          contact_name: data.contact_name ?? data.contact_person ?? '',
          phone: data.phone ?? data.contact_phone ?? '',
          instagram: data.instagram ?? '',
          linkedin: data.linkedin ?? '',
          youtube: data.youtube ?? '',
          twitter: data.twitter ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [reset])

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  async function onSubmit(data: ProfileForm) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setSaving(false); return }

    let logo_url = currentLogo
    if (logoFile && userId) {
      const ext = logoFile.name.split('.').pop()
      const path = `${userId}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, logoFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        logo_url = publicUrl
        setCurrentLogo(publicUrl)
        setLogoFile(null)
      }
    }

    const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]))
    const { error } = await supabase.from('brand_profiles').update({
      ...clean,
      logo_url,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)

    if (error) toast.error('Could not save: ' + error.message)
    else toast.success('Profile updated!')
    setSaving(false)
  }

  if (loading) return (
    <div>
      <div className="dash-page-title">Brand Profile</div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => <div key={i} className="dash-skel" style={{ height: 80, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 660 }}>
      <div className="dash-page-title">Brand Profile</div>
      <div className="dash-page-subtitle">Update your brand information visible to creators.</div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 24 }}>

        {/* Logo + Company Info */}
        <Card>
          <SectionDivider title="Company Info" />

          {/* Logo upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '18px 0 22px' }}>
            <div onClick={() => fileRef.current?.click()} style={{ width: 76, height: 76, borderRadius: 16, cursor: 'pointer', border: '2px dashed #bfdbfe', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {(logoPreview || currentLogo)
                ? <img src={logoPreview ?? currentLogo!} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center' }}><Camera size={20} style={{ color: '#93c5fd', display: 'block', margin: '0 auto 2px' }} /><span style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 600 }}>Logo</span></div>
              }
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>Brand Logo</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>PNG or JPG · max 5MB</div>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Change Logo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
            <div>
              <label style={lbl}>Company Name *</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('company_name')} className="input" style={{ paddingLeft: 36 }} placeholder="Your company name" />
              </div>
              {errors.company_name && <span style={errStyle}>{errors.company_name.message}</span>}
            </div>
            <div>
              <label style={lbl}>Website</label>
              <div style={{ position: 'relative' }}>
                <Globe size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('website')} className="input" style={{ paddingLeft: 36 }} placeholder="https://yoursite.com" />
              </div>
            </div>
            <div>
              <label style={lbl}>Industry *</label>
              <select {...register('industry')} className="input">
                <option value="">Select industry</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
              {errors.industry && <span style={errStyle}>{errors.industry.message}</span>}
            </div>
            <div>
              <label style={lbl}>Location *</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('location')} className="input" style={{ paddingLeft: 36 }} placeholder="Mumbai, India" />
              </div>
              {errors.location && <span style={errStyle}>{errors.location.message}</span>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>About Your Company *</label>
              <textarea {...register('description')} className="input" rows={3} placeholder="Tell creators about your brand, what you sell, and your target audience..." />
              {errors.description && <span style={errStyle}>{errors.description.message}</span>}
            </div>
          </div>
        </Card>

        {/* Social Media */}
        <Card>
          <SectionDivider title="Social Media" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginTop: 18 }}>
            <div>
              <label style={lbl}>Instagram</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#e1306c', pointerEvents: 'none' }} />
                <input {...register('instagram')} className="input" style={{ paddingLeft: 36 }} placeholder="https://instagram.com/yourbrand" />
              </div>
            </div>
            <div>
              <label style={lbl}>LinkedIn</label>
              <div style={{ position: 'relative' }}>
                <Link2 size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#0a66c2', pointerEvents: 'none' }} />
                <input {...register('linkedin')} className="input" style={{ paddingLeft: 36 }} placeholder="https://linkedin.com/company/yourbrand" />
              </div>
            </div>
            <div>
              <label style={lbl}>YouTube</label>
              <div style={{ position: 'relative' }}>
                <PlayCircle size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ff4444', pointerEvents: 'none' }} />
                <input {...register('youtube')} className="input" style={{ paddingLeft: 36 }} placeholder="https://youtube.com/c/yourbrand" />
              </div>
            </div>
            <div>
              <label style={lbl}>X / Twitter</label>
              <div style={{ position: 'relative' }}>
                <MessageCircle size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('twitter')} className="input" style={{ paddingLeft: 36 }} placeholder="https://x.com/yourbrand" />
              </div>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <SectionDivider title="Contact Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginTop: 18 }}>
            <div>
              <label style={lbl}>Contact Person *</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('contact_name')} className="input" style={{ paddingLeft: 36 }} placeholder="Full name" />
              </div>
              {errors.contact_name && <span style={errStyle}>{errors.contact_name.message}</span>}
            </div>
            <div>
              <label style={lbl}>Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('phone')} className="input" style={{ paddingLeft: 36 }} placeholder="9876543210" />
              </div>
              {errors.phone && <span style={errStyle}>{errors.phone.message}</span>}
            </div>
          </div>
        </Card>

        <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', marginBottom: 32 }}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
