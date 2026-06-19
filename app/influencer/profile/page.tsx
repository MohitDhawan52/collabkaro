'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Save, IndianRupee, AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NICHES, PLATFORMS } from '@/types/index'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  bio: z.string().optional(),
  location: z.string().optional(),
  niche: z.array(z.string()).min(1, 'Select at least one niche'),
  instagram_handle: z.string().optional(),
  instagram_followers: z.coerce.number().min(0).optional().or(z.literal('')),
  instagram_engagement_rate: z.coerce.number().min(0).optional().or(z.literal('')),
  youtube_channel: z.string().optional(),
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

const labelStyle: React.CSSProperties = {
  fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8,
}
const errStyle: React.CSSProperties = {
  fontSize: 12, color: '#DC2626', marginTop: 5, display: 'block',
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--bg-border)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(109,40,217,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  )
}

function ChipSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: active ? '1.5px solid var(--brand-primary)' : '1.5px solid var(--bg-border)',
            background: active ? 'rgba(109,40,217,0.08)' : 'var(--bg-input)',
            color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
            transition: 'all 0.14s ease',
          }}>{opt}</button>
        )
      })}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: '24px 26px', boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
      {children}
    </div>
  )
}

export default function InfluencerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProfileForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { niche: [], barter_open: false },
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('influencer_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        reset({
          full_name: data.full_name ?? '',
          bio: data.bio ?? '',
          location: data.location ?? '',
          niche: data.niche ?? [],
          instagram_handle: data.instagram_handle ?? '',
          instagram_followers: data.instagram_followers ?? '',
          instagram_engagement_rate: data.instagram_engagement_rate ?? '',
          youtube_channel: data.youtube_channel ?? '',
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

  async function onSubmit(data: ProfileForm) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setSaving(false); return }

    const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]))

    const { error } = await supabase
      .from('influencer_profiles')
      .update({ ...clean, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) toast.error('Could not save: ' + error.message)
    else toast.success('Profile updated!')
    setSaving(false)
  }

  if (loading) return (
    <div>
      <div className="dash-page-title">My Profile</div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ height: 80, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="dash-page-title">My Profile</div>
      <div className="dash-page-subtitle">Keep your profile updated so brands can find and trust you.</div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 24 }}>
        {/* Basic Info */}
        <Card>
          <SectionHeader icon={<User size={17} />} title="Basic Info" sub="Your public profile visible to brands" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input {...register('full_name')} className="input" placeholder="Your full name" />
              {errors.full_name && <span style={errStyle}>{errors.full_name.message}</span>}
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea {...register('bio')} className="input" rows={3} placeholder="Tell brands about yourself and your content style..." />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input {...register('location')} className="input" placeholder="e.g. Delhi, India" />
            </div>
            <div>
              <label style={labelStyle}>Your Niche *</label>
              <Controller control={control} name="niche" render={({ field }) => (
                <ChipSelect options={NICHES} selected={field.value} onChange={field.onChange} />
              )} />
              {errors.niche && <span style={errStyle}>{errors.niche.message}</span>}
            </div>
          </div>
        </Card>

        {/* Social Media */}
        <Card>
          <SectionHeader icon={<AtSign size={17} />} title="Social Media" sub="Your handles and follower counts" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Instagram Handle</label>
                <input {...register('instagram_handle')} className="input" placeholder="username (no @)" />
              </div>
              <div>
                <label style={labelStyle}>Instagram Followers</label>
                <input {...register('instagram_followers')} type="number" className="input" placeholder="e.g. 50000" min={0} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Instagram Engagement Rate (%)</label>
              <input {...register('instagram_engagement_rate')} type="number" step="0.1" className="input" placeholder="e.g. 3.5" min={0} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>YouTube Channel</label>
                <input {...register('youtube_channel')} className="input" placeholder="Channel name or URL" />
              </div>
              <div>
                <label style={labelStyle}>YouTube Subscribers</label>
                <input {...register('youtube_subscribers')} type="number" className="input" placeholder="e.g. 100000" min={0} />
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card>
          <SectionHeader icon={<IndianRupee size={17} />} title="Your Rates" sub="What you charge brands per content type" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Instagram Post (₹)</label>
                <input {...register('instagram_post_price')} type="number" className="input" placeholder="e.g. 5000" min={0} />
              </div>
              <div>
                <label style={labelStyle}>Instagram Reel (₹)</label>
                <input {...register('instagram_reel_price')} type="number" className="input" placeholder="e.g. 8000" min={0} />
              </div>
              <div>
                <label style={labelStyle}>Instagram Story (₹)</label>
                <input {...register('instagram_story_price')} type="number" className="input" placeholder="e.g. 2000" min={0} />
              </div>
              <div>
                <label style={labelStyle}>YouTube Dedicated (₹)</label>
                <input {...register('youtube_dedicated_price')} type="number" className="input" placeholder="e.g. 25000" min={0} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input {...register('barter_open')} type="checkbox" id="barter" style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="barter" style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
                I'm open to barter/product collaborations
              </label>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card>
          <SectionHeader icon={<Save size={17} />} title="Bank Details" sub="For receiving payouts — kept private" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Account Holder Name</label>
              <input {...register('bank_account_name')} className="input" placeholder="Name as on bank account" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Account Number</label>
                <input {...register('bank_account_number')} className="input" placeholder="Account number" />
              </div>
              <div>
                <label style={labelStyle}>IFSC Code</label>
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
