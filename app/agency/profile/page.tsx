'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const schema = z.object({
  agency_name: z.string().min(2, 'Agency name is required'),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  contact_email: z.string().email('Enter a valid email'),
  contact_phone: z.string().optional(),
  gst_number: z.string().optional(),
  city: z.string().optional(),
})

type ProfileForm = z.infer<typeof schema>

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

export default function AgencyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agencyUserId, setAgencyUserId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAgencyUserId(user.id)
      const { data } = await supabase.from('agency_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        const d = data as unknown as { agency_name?: string; website?: string; description?: string; contact_email?: string; contact_phone?: string; gst_number?: string; city?: string }
        reset({ agency_name: d.agency_name ?? '', website: d.website ?? '', description: d.description ?? '', contact_email: d.contact_email ?? '', contact_phone: d.contact_phone ?? '', gst_number: d.gst_number ?? '', city: d.city ?? '' })
      }
      setLoading(false)
    }
    load()
  }, [reset])

  async function onSubmit(data: ProfileForm) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('agency_profiles').upsert({ user_id: agencyUserId, ...data }, { onConflict: 'user_id' })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile saved!')
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 20 }}><div className="dash-spinner" /></div>

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="dash-page-title">Agency Profile</div>
      <div className="dash-page-subtitle">Your agency's public information visible to brands and influencers.</div>

      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 20, padding: '28px 24px', marginTop: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <Building2 size={22} color="#7C3AED" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Agency Name *</label>
                <input {...register('agency_name')} style={inputStyle} placeholder="MonkWise Media" />
                {errors.agency_name && <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.agency_name.message}</span>}
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input {...register('city')} style={inputStyle} placeholder="Mumbai" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Website</label>
              <input {...register('website')} style={inputStyle} placeholder="https://monkwisemedia.com" />
              {errors.website && <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.website.message}</span>}
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea {...register('description')} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Tell brands and influencers what your agency does…" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Contact Email *</label>
                <input {...register('contact_email')} type="email" style={inputStyle} placeholder="hello@agency.com" />
                {errors.contact_email && <span style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.contact_email.message}</span>}
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input {...register('contact_phone')} type="tel" style={inputStyle} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>GST Number <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 400 }}>(for invoices)</span></label>
              <input {...register('gst_number')} style={inputStyle} placeholder="27AABCU9603R1ZX" />
            </div>

            <button type="submit" disabled={saving} style={{ padding: '13px', borderRadius: 12, border: 'none', background: saving ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
