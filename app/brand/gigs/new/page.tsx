'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  Clock,
  Monitor,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NICHES, PLATFORMS } from '@/types/index'

// ── Zod schema ──────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(30, 'Please write at least 30 characters describing the campaign'),
  collab_type: z.enum(['paid', 'barter', 'both']),
  niche_required: z.array(z.string()).min(1, 'Select at least one niche'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  min_followers: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  max_budget: z.union([z.coerce.number().min(1, 'Please enter a budget'), z.literal('')]).optional(),
  deliverables: z.string().min(10, 'Please describe what you need from the creator'),
  timeline: z.string().optional(),
})

type GigForm = z.infer<typeof schema>

const STEPS = ['Campaign Details', 'Audience & Platforms', 'Deliverables & Budget']

// ── Multi-select chip component ──────────────────────────────
function ChipSelect({
  options,
  selected,
  onChange,
  max,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  max?: number
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else {
      if (max && selected.length >= max) return
      onChange([...selected, opt])
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              border: active ? '1.5px solid var(--brand-primary)' : '1.5px solid var(--bg-border)',
              background: active ? 'rgba(109, 40, 217, 0.08)' : 'var(--bg-input)',
              color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
              transition: 'all 0.14s ease',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function PostGigPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<GigForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      collab_type: 'paid',
      niche_required: [],
      platforms: [],
    },
  })

  const collabType = watch('collab_type')

  async function goNext() {
    let fields: (keyof GigForm)[] = []
    if (step === 0) fields = ['title', 'description', 'collab_type']
    if (step === 1) fields = ['niche_required', 'platforms', 'min_followers']
    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(data: GigForm) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!brand) throw new Error('Brand profile not found')

      const { error } = await supabase.from('gigs').insert({
        brand_id: brand.id,
        title: data.title,
        description: data.description,
        collab_type: data.collab_type,
        niche_required: data.niche_required,
        platforms: data.platforms,
        min_followers: data.min_followers || null,
        max_budget: data.max_budget || null,
        deliverables: data.deliverables,
        timeline: data.timeline || null,
        status: 'active',
        payment_status: 'pending',
        gig_fee: 250,
      })

      if (error) throw error

      toast.success('Gig posted! Creators can now apply.')
      router.push('/brand/gigs')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <button
        onClick={() => step > 0 ? setStep((s) => s - 1) : router.push('/brand/dashboard')}
        className="dash-nav-item"
        style={{ width: 'auto', marginBottom: 20, paddingLeft: 0 }}
      >
        <ArrowLeft size={16} />
        <span>{step > 0 ? 'Back' : 'Dashboard'}</span>
      </button>

      <div className="dash-page-title">Post a Gig</div>
      <div className="dash-page-subtitle">Tell creators what you're looking for in your campaign.</div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 32 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: i < step ? '#22c55e' : i === step ? 'var(--brand-primary)' : 'var(--bg-border)',
                color: i <= step ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {i < step ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: i === step ? 600 : 400,
                color: i === step ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {label}
              </span>
            </div>
            <div className="step-bar" style={{
              background: i <= step ? 'var(--brand-primary)' : 'var(--bg-border)',
            }} />
          </div>
        ))}
      </div>

      {/* Form card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 20,
        padding: '28px 28px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* ── STEP 0: Campaign Details ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(109,40,217,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)',
                }}>
                  <Sparkles size={17} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Campaign basics
                </div>
              </div>

              <div>
                <label style={labelStyle}>Campaign Title *</label>
                <input
                  {...register('title')}
                  className="input"
                  placeholder="e.g. Summer Collection Launch with Lifestyle Creators"
                />
                {errors.title && <span style={errStyle}>{errors.title.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Campaign Description *</label>
                <textarea
                  {...register('description')}
                  className="input"
                  rows={5}
                  placeholder="Describe your brand, the campaign goal, what you're selling, and the kind of creator you're looking for..."
                />
                {errors.description && <span style={errStyle}>{errors.description.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Collaboration Type *</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {(['paid', 'barter', 'both'] as const).map((type) => (
                    <label
                      key={type}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 12, textAlign: 'center',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        border: collabType === type
                          ? '2px solid var(--brand-primary)'
                          : '1.5px solid var(--bg-border)',
                        background: collabType === type ? 'rgba(109,40,217,0.06)' : 'var(--bg-input)',
                        color: collabType === type ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        {...register('collab_type')}
                        type="radio"
                        value={type}
                        style={{ display: 'none' }}
                      />
                      {type === 'paid' && '💰 Paid'}
                      {type === 'barter' && '🤝 Barter'}
                      {type === 'both' && '✨ Both'}
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  {collabType === 'paid' && 'You pay the creator in cash for their content.'}
                  {collabType === 'barter' && 'You give your product/service in exchange for content. No cash involved.'}
                  {collabType === 'both' && 'You\'re open to both paid and product-exchange deals.'}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Audience & Platforms ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(109,40,217,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)',
                }}>
                  <Users size={17} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Target audience
                </div>
              </div>

              <div>
                <label style={labelStyle}>Niche / Category *</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  What type of creator are you looking for?
                </div>
                <Controller
                  control={control}
                  name="niche_required"
                  render={({ field }) => (
                    <ChipSelect
                      options={NICHES}
                      selected={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.niche_required && <span style={errStyle}>{errors.niche_required.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Platforms *</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Where should the creator post?
                </div>
                <Controller
                  control={control}
                  name="platforms"
                  render={({ field }) => (
                    <ChipSelect
                      options={PLATFORMS}
                      selected={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.platforms && <span style={errStyle}>{errors.platforms.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Minimum Followers</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
                  Leave blank to accept creators of any size
                </div>
                <input
                  {...register('min_followers')}
                  type="number"
                  className="input"
                  placeholder="e.g. 10000"
                  min={0}
                />
                {errors.min_followers && <span style={errStyle}>{errors.min_followers.message}</span>}
              </div>
            </div>
          )}

          {/* ── STEP 2: Deliverables & Budget ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(109,40,217,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)',
                }}>
                  <IndianRupee size={17} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  What you need & what you'll pay
                </div>
              </div>

              <div>
                <label style={labelStyle}>Deliverables *</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
                  Be specific — what exactly do you want the creator to make?
                </div>
                <textarea
                  {...register('deliverables')}
                  className="input"
                  rows={4}
                  placeholder="e.g. 1 Instagram Reel (60 sec), 2 Instagram Stories, 1 unboxing video on YouTube. Product must be featured prominently. Brand mention in caption required."
                />
                {errors.deliverables && <span style={errStyle}>{errors.deliverables.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} /> Timeline / Deadline
                  </span>
                </label>
                <input
                  {...register('timeline')}
                  className="input"
                  placeholder="e.g. Content to be posted by July 15, 2025"
                />
              </div>

              {collabType !== 'barter' && (
                <div>
                  <label style={labelStyle}>Maximum Budget (₹) *</label>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
                    Your upper limit — creators will pitch within this range
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', fontSize: 15, fontWeight: 600,
                    }}>₹</span>
                    <input
                      {...register('max_budget')}
                      type="number"
                      className="input"
                      style={{ paddingLeft: 32 }}
                      placeholder="e.g. 15000"
                      min={0}
                    />
                  </div>
                  {errors.max_budget && <span style={errStyle}>{errors.max_budget.message}</span>}
                </div>
              )}

              {/* Gig fee notice */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 12,
                fontSize: 13,
                color: '#92400E',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Monitor size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Platform fee: ₹250</strong> — A one-time gig listing fee will be charged when you publish.
                  Your gig goes live instantly and stays active until you pause or close it.
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Publishing...' : '🚀 Publish Gig'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: 'var(--text-primary)',
  display: 'block',
  marginBottom: 8,
}

const errStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#DC2626',
  marginTop: 5,
  display: 'block',
}
