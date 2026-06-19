'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { INDUSTRIES } from '@/types/index'

const schema = z.object({
  brand_name: z.string().min(2, 'Brand name is required'),
  website: z.string().optional(),
  industry: z.string().min(1, 'Please select an industry'),
  description: z.string().min(10, 'Please add a short description'),
  location: z.string().min(2, 'Location is required'),
  contact_person: z.string().min(2, 'Contact person name is required'),
  contact_phone: z.string().min(10, 'Valid phone number required'),
})

type ProfileForm = z.infer<typeof schema>

const labelStyle: React.CSSProperties = {
  fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8,
}
const errStyle: React.CSSProperties = {
  fontSize: 12, color: '#DC2626', marginTop: 5, display: 'block',
}

export default function BrandProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: brand } = await supabase
        .from('brand_profiles').select('*').eq('user_id', user.id).single()

      if (brand) {
        setProfileId(brand.id)
        reset({
          brand_name: brand.brand_name ?? '',
          website: brand.website ?? '',
          industry: brand.industry ?? '',
          description: brand.description ?? '',
          location: brand.location ?? '',
          contact_person: brand.contact_person ?? '',
          contact_phone: brand.contact_phone ?? '',
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

    const { error } = await supabase
      .from('brand_profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) {
      toast.error('Could not save changes: ' + error.message)
    } else {
      toast.success('Profile updated!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div>
        <div className="dash-page-title">Brand Profile</div>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="dash-skel" style={{ height: 56, borderRadius: 12 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div className="dash-page-title">Brand Profile</div>
      </div>
      <div className="dash-page-subtitle">Update your brand information visible to creators.</div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
        borderRadius: 20, padding: '28px', boxShadow: 'var(--shadow-card)', marginTop: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'rgba(109,40,217,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)',
          }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Brand Details</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Visible to influencers when they view your gigs</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Brand Name *</label>
              <input {...register('brand_name')} className="input" placeholder="e.g. Mamaearth" />
              {errors.brand_name && <span style={errStyle}>{errors.brand_name.message}</span>}
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input {...register('website')} className="input" placeholder="https://yoursite.com" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Industry *</label>
            <select {...register('industry')} className="input">
              <option value="">Select industry</option>
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            {errors.industry && <span style={errStyle}>{errors.industry.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea {...register('description')} className="input" rows={4}
              placeholder="Tell creators about your brand, what you sell, and your target audience..." />
            {errors.description && <span style={errStyle}>{errors.description.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Location *</label>
            <input {...register('location')} className="input" placeholder="e.g. Mumbai, Maharashtra" />
            {errors.location && <span style={errStyle}>{errors.location.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input {...register('contact_person')} className="input" placeholder="Full name" />
              {errors.contact_person && <span style={errStyle}>{errors.contact_person.message}</span>}
            </div>
            <div>
              <label style={labelStyle}>Contact Phone *</label>
              <input {...register('contact_phone')} className="input" placeholder="+91 98765 43210" />
              {errors.contact_phone && <span style={errStyle}>{errors.contact_phone.message}</span>}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 8 }}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
