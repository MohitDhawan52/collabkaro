'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Save, IndianRupee, AtSign, Camera, MapPin, Phone, PlayCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NICHES } from '@/types/index'

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  gender: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  niche: z.array(z.string()).min(1, 'Select at least one niche'),
  instagram_handle: z.string().optional(),
  instagram_followers: z.coerce.number().min(0).optional().or(z.literal('')),
  instagram_engagement_rate: z.coerce.number().min(0).optional().or(z.literal('')),
  youtube_handle: z.string().optional(),
  youtube_subscribers: z.coerce.number().min(0).optional().or(z.literal('')),
  instagram_post_price: z.coerce.number().min(0).optional().or(z.literal('')),
  instagram_reel_price: z.coerce.number().min(0).optional().or(z.literal('')),
  instagram_story_price: z.coerce.number().min(0).optional().or(z.literal('')),
  youtube_dedicated_price: z.coerce.number().min(0).optional().or(z.literal('')),
  barter_open: z.boolean(),
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string().optional(),
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

function ChipSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: active ? '1.5px solid #1d4ed8' : '1.5px solid var(--bg-border)', background: active ? '#eff6ff' : 'var(--bg-input)', color: active ? '#1d4ed8' : 'var(--text-secondary)', transition: 'all 0.14s ease' }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }
const errStyle: React.CSSProperties = { fontSize: 12, color: '#DC2626', marginTop: 5, display: 'block' }

export default function InfluencerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<ProfileForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { niche: [], barter_open: false, gender: '' },
  })

  const gender = watch('gender')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('influencer_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setCurrentAvatar(data.avatar_url ?? null)
        reset({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          gender: data.gender ?? '',
          bio: data.bio ?? '',
          location: data.location ?? '',
          niche: Array.isArray(data.niche) ? data.niche : (data.niche ? [data.niche] : []),
          instagram_handle: data.instagram_handle ?? '',
          instagram_followers: data.instagram_followers ?? '',
          instagram_engagement_rate: data.instagram_engagement_rate ?? '',
          youtube_handle: data.youtube_handle ?? data.youtube_channel ?? '',
          youtube_subscribers: data.youtube_subscribers ?? '',
          instagram_post_price: data.instagram_post_price ?? '',
          instagram_reel_price: data.instagram_reel_price ?? '',
          instagram_story_price: data.instagram_story_price ?? '',
          youtube_dedicated_price: data.youtube_dedicated_price ?? '',
          barter_open: data.barter_open ?? false,
          bank_account_name: data.bank_account_name ?? '',
          bank_account_number: data.bank_account_number ?? '',
          bank_ifsc: data.bank_ifsc ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [reset])

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  async function onSubmit(data: ProfileForm) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setSaving(false); return }

    let avatar_url = currentAvatar
    if (avatarFile && userId) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = publicUrl
        setCurrentAvatar(publicUrl)
        setAvatarFile(null)
      }
    }

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token ?? null

    const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]))
    const res = await fetch('/api/influencer/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ ...clean, avatar_url, updated_at: new Date().toISOString() }),
    })
    const json = await res.json()

    if (!res.ok) toast.error('Could not save: ' + (json.error ?? res.statusText))
    else toast.success('Profile updated!')
    setSaving(false)
  }

  if (loading) return (
    <div>
      <div className="dash-page-title">My Profile</div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => <div key={i} className="dash-skel" style={{ height: 80, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 660 }}>
      <div className="dash-page-title">My Profile</div>
      <div className="dash-page-subtitle">Keep your profile updated so brands can find and trust you.</div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 24 }}>

        {/* Photo + Basic Info */}
        <Card>
          <SectionDivider title="Personal Info" />

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '18px 0 22px' }}>
            <div onClick={() => fileRef.current?.click()} style={{ width: 76, height: 76, borderRadius: '50%', cursor: 'pointer', border: '2px dashed #bfdbfe', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {(avatarPreview || currentAvatar)
                ? <img src={avatarPreview ?? currentAvatar!} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center' }}><Camera size={20} style={{ color: '#93c5fd', display: 'block', margin: '0 auto 2px' }} /><span style={{ fontSize: 9.5, color: '#93c5fd', fontWeight: 600 }}>Photo</span></div>
              }
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>Profile Photo</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>JPG or PNG · max 5MB</div>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Change Photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickAvatar} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
            <div>
              <label style={lbl}>Full Name *</label>
              <input {...register('full_name')} className="input" placeholder="Your full name" />
              {errors.full_name && <span style={errStyle}>{errors.full_name.message}</span>}
            </div>
            <div>
              <label style={lbl}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('phone')} className="input" style={{ paddingLeft: 36 }} placeholder="9876543210" />
              </div>
            </div>
            <div>
              <label style={lbl}>Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('location')} className="input" style={{ paddingLeft: 36 }} placeholder="Mumbai, India" />
              </div>
            </div>
            <div>
              <label style={lbl}>Gender</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                {GENDERS.map(g => (
                  <button key={g} type="button" onClick={() => setValue('gender', g)} style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${gender === g ? '#1d4ed8' : 'var(--bg-border)'}`, background: gender === g ? '#eff6ff' : 'var(--bg-input)', color: gender === g ? '#1d4ed8' : 'var(--text-secondary)', fontSize: 12.5, fontWeight: gender === g ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Bio</label>
              <textarea {...register('bio')} className="input" rows={3} placeholder="Tell brands about yourself and your content style..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Your Niche *</label>
              <Controller control={control} name="niche" render={({ field }) => (
                <ChipSelect options={NICHES} selected={field.value} onChange={field.onChange} />
              )} />
              {errors.niche && <span style={errStyle}>{errors.niche.message}</span>}
            </div>
          </div>
        </Card>

        {/* Social Media */}
        <Card>
          <SectionDivider title="Social Media" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginTop: 18 }}>
            <div>
              <label style={lbl}>Instagram Handle</label>
              <div style={{ position: 'relative' }}>
                <AtSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#e1306c', pointerEvents: 'none' }} />
                <input {...register('instagram_handle')} className="input" style={{ paddingLeft: 36 }} placeholder="username (no @)" />
              </div>
            </div>
            <div>
              <label style={lbl}>Instagram Followers</label>
              <input {...register('instagram_followers')} type="number" className="input" placeholder="e.g. 50000" min={0} />
            </div>
            <div>
              <label style={lbl}>Instagram Engagement (%)</label>
              <input {...register('instagram_engagement_rate')} type="number" step="0.1" className="input" placeholder="e.g. 3.5" min={0} />
            </div>
            <div>
              <label style={lbl}>YouTube Channel</label>
              <div style={{ position: 'relative' }}>
                <PlayCircle size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ff4444', pointerEvents: 'none' }} />
                <input {...register('youtube_handle')} className="input" style={{ paddingLeft: 36 }} placeholder="@yourchannel" />
              </div>
            </div>
            <div>
              <label style={lbl}>YouTube Subscribers</label>
              <input {...register('youtube_subscribers')} type="number" className="input" placeholder="e.g. 100000" min={0} />
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card>
          <SectionDivider title="Your Rates" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginTop: 18 }}>
            <div>
              <label style={lbl}><IndianRupee size={11} style={{ display: 'inline' }} /> Instagram Post</label>
              <input {...register('instagram_post_price')} type="number" className="input" placeholder="e.g. 5000" min={0} />
            </div>
            <div>
              <label style={lbl}><IndianRupee size={11} style={{ display: 'inline' }} /> Instagram Reel</label>
              <input {...register('instagram_reel_price')} type="number" className="input" placeholder="e.g. 8000" min={0} />
            </div>
            <div>
              <label style={lbl}><IndianRupee size={11} style={{ display: 'inline' }} /> Instagram Story</label>
              <input {...register('instagram_story_price')} type="number" className="input" placeholder="e.g. 2000" min={0} />
            </div>
            <div>
              <label style={lbl}><IndianRupee size={11} style={{ display: 'inline' }} /> YouTube Dedicated</label>
              <input {...register('youtube_dedicated_price')} type="number" className="input" placeholder="e.g. 25000" min={0} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input {...register('barter_open')} type="checkbox" id="barter" style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1d4ed8' }} />
              <label htmlFor="barter" style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
                I'm open to barter / product collaborations
              </label>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card>
          <SectionDivider title="Bank Details" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
            <div>
              <label style={lbl}>Account Holder Name</label>
              <input {...register('bank_account_name')} className="input" placeholder="Name as on bank account" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
              <div>
                <label style={lbl}>Account Number</label>
                <input {...register('bank_account_number')} className="input" placeholder="Account number" />
              </div>
              <div>
                <label style={lbl}>IFSC Code</label>
                <input {...register('bank_ifsc')} className="input" placeholder="e.g. HDFC0001234" />
              </div>
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
