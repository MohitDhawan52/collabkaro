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
  influencer_limit: z.coerce.number().min(1, 'Must be at least 1').max(500, 'Max 500'),
  max_budget: z.union([z.coerce.number().min(1, 'Please enter a budget'), z.literal('')]).optional(),
  deliverables: z.string().optional(),
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
const DELIVERABLE_TYPES = [
  { id: 'ig_reel',    label: 'Instagram Reel',   emoji: '🎬' },
  { id: 'ig_post',    label: 'Instagram Post',   emoji: '📸' },
  { id: 'ig_story',   label: 'Instagram Story',  emoji: '⭕' },
  { id: 'ig_live',    label: 'Instagram Live',   emoji: '🔴' },
  { id: 'yt_video',   label: 'YouTube Video',    emoji: '▶️' },
  { id: 'yt_short',   label: 'YouTube Short',    emoji: '⚡' },
  { id: 'tiktok',     label: 'TikTok Video',     emoji: '🎵' },
  { id: 'twitter',    label: 'Twitter/X Post',   emoji: '✖️' },
  { id: 'linkedin',   label: 'LinkedIn Post',    emoji: '💼' },
  { id: 'blog',       label: 'Blog Article',     emoji: '✍️' },
  { id: 'pinterest',  label: 'Pinterest Pin',    emoji: '📌' },
  { id: 'podcast',    label: 'Podcast Mention',  emoji: '🎙️' },
]

interface DeliverableItem {
  id: string
  label: string
  emoji: string
  qty: number
  due_date: string
}

export default function PostGigPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([])
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [addAmount, setAddAmount] = useState('')
  const [addingFunds, setAddingFunds] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<GigForm | null>(null)

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
      influencer_limit: 1,
    },
  })

  const collabType = watch('collab_type')

  function toggleDeliverable(type: typeof DELIVERABLE_TYPES[0]) {
    setDeliverables(prev => {
      if (prev.find(d => d.id === type.id)) return prev.filter(d => d.id !== type.id)
      return [...prev, { ...type, qty: 1, due_date: '' }]
    })
  }

  function updateDeliverable(id: string, field: 'qty' | 'due_date', value: string | number) {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  async function goNext() {
    let fields: (keyof GigForm)[] = []
    if (step === 0) fields = ['title', 'description', 'collab_type']
    if (step === 1) fields = ['niche_required', 'platforms', 'min_followers']
    if (step === 2) {
      if (deliverables.length === 0) { toast.error('Select at least one deliverable'); return }
      if (deliverables.some(d => !d.due_date)) { toast.error('Set a due date for every deliverable'); return }
    }
    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  async function addFunds() {
    const amount = parseFloat(addAmount)
    if (!amount || amount < 100) { toast.error('Minimum top-up is ₹100'); return }
    setAddingFunds(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { data: wallet } = await supabase.from('brand_wallet').select('id, balance').eq('user_id', user.id).single()
      if (!wallet) throw new Error('Wallet not found')
      const newBalance = (wallet.balance ?? 0) + amount
      await supabase.from('brand_wallet').update({ balance: newBalance }).eq('id', wallet.id)
      await supabase.from('wallet_transactions').insert({ user_id: user.id, type: 'credit', amount, description: 'Funds added', balance_after: newBalance })
      setWalletBalance(newBalance)
      setAddAmount('')
      toast.success(`₹${amount.toLocaleString('en-IN')} added to wallet!`)
      setShowAddFunds(false)
      if (pendingSubmit) {
        setPendingSubmit(null)
        onSubmit(pendingSubmit)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add funds')
    } finally {
      setAddingFunds(false)
    }
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

      if (deliverables.length === 0) { toast.error('Select at least one deliverable'); setSubmitting(false); return }
      if (deliverables.some(d => !d.due_date)) { toast.error('Set a due date for every deliverable'); setSubmitting(false); return }

      // Wallet check — ₹250 gig listing fee
      const { data: wallet } = await supabase.from('brand_wallet').select('balance').eq('user_id', user.id).single()
      const balance = wallet?.balance ?? 0
      setWalletBalance(balance)
      if (balance < 250) {
        setPendingSubmit(data)
        setSubmitting(false)
        setShowAddFunds(true)
        return
      }

      const { error } = await supabase.from('gigs').insert({
        brand_id: brand.id,
        title: data.title,
        description: data.description,
        collab_type: data.collab_type,
        niche_required: data.niche_required,
        platforms: data.platforms,
        min_followers: data.min_followers || null,
        influencer_limit: data.influencer_limit,
        max_budget: data.max_budget || null,
        deliverables: JSON.stringify(deliverables.map(d => ({ type: d.label, emoji: d.emoji, qty: d.qty, due_date: d.due_date }))),
        timeline: deliverables.map(d => `${d.qty}× ${d.label} by ${new Date(d.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`).join(', '),
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

              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={13} /> Number of Influencers Wanted *
                  </span>
                </label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
                  How many creators do you want to finalize for this campaign? Pitches are unlimited — you pick the best ones up to this limit.
                </div>
                <input
                  {...register('influencer_limit')}
                  type="number"
                  className="input"
                  placeholder="e.g. 5"
                  min={1}
                  max={500}
                />
                {errors.influencer_limit && <span style={errStyle}>{errors.influencer_limit.message}</span>}
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

              {/* Deliverable type grid */}
              <div>
                <label style={labelStyle}>Select Content Types *</label>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
                  Pick what you want creators to make. Set quantity + due date for each.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {DELIVERABLE_TYPES.map(type => {
                    const selected = deliverables.some(d => d.id === type.id)
                    return (
                      <button key={type.id} type="button" onClick={() => toggleDeliverable(type)}
                        style={{ padding: '10px 8px', borderRadius: 12, border: `1.5px solid ${selected ? 'var(--brand-primary)' : 'var(--bg-border)'}`, background: selected ? 'rgba(109,40,217,0.07)' : 'var(--bg-input)', color: selected ? 'var(--brand-primary)' : 'var(--text-secondary)', fontWeight: selected ? 700 : 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.13s ease', textAlign: 'left' }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{type.emoji}</span>
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Per-deliverable qty + due date */}
              {deliverables.length > 0 && (
                <div>
                  <label style={labelStyle}>Quantity & Due Date</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {deliverables.map(d => (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-input)', border: '1.5px solid rgba(109,40,217,0.2)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span>{d.emoji}</span> {d.label}
                        </div>
                        {/* Qty stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button type="button" onClick={() => updateDeliverable(d.id, 'qty', Math.max(1, d.qty - 1))}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--bg-border)', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontFamily: 'inherit' }}>−</button>
                          <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: 'var(--brand-primary)' }}>{d.qty}</span>
                          <button type="button" onClick={() => updateDeliverable(d.id, 'qty', d.qty + 1)}
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--bg-border)', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontFamily: 'inherit' }}>+</button>
                        </div>
                        {/* Due date */}
                        <input type="date" value={d.due_date} min={new Date().toISOString().split('T')[0]}
                          onChange={e => updateDeliverable(d.id, 'due_date', e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${d.due_date ? 'rgba(109,40,217,0.4)' : 'var(--bg-border)'}`, background: '#fff', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
                      </div>
                    ))}
                  </div>
                  {deliverables.some(d => !d.due_date) && (
                    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>Set a due date for each selected deliverable</div>
                  )}
                </div>
              )}

              {collabType !== 'barter' && (
                <div>
                  <label style={labelStyle}>Budget per Influencer (₹) *</label>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>
                    Amount you'll pay each creator. Total campaign spend = Budget × No. of Influencers.
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
                      placeholder="e.g. 5000"
                      min={0}
                    />
                  </div>
                  {errors.max_budget && <span style={errStyle}>{errors.max_budget.message}</span>}
                  {/* Live total calculator */}
                  {watch('max_budget') && watch('influencer_limit') && Number(watch('max_budget')) > 0 && (
                    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(109,40,217,0.06)', border: '1px solid rgba(109,40,217,0.15)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>₹{Number(watch('max_budget')).toLocaleString('en-IN')} × {watch('influencer_limit')} influencers</span>
                      <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>= ₹{(Number(watch('max_budget')) * Number(watch('influencer_limit'))).toLocaleString('en-IN')} total</span>
                    </div>
                  )}
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

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddFunds(false) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>💳</div>
            <div style={{ fontSize: 19, fontWeight: 900, textAlign: 'center', color: 'var(--text-primary)', marginBottom: 6 }}>Add Funds to Wallet</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Publishing a gig costs <strong style={{ color: '#f59e0b' }}>₹250</strong>. Your current wallet balance is <strong style={{ color: walletBalance !== null && walletBalance < 250 ? '#ef4444' : '#10b981' }}>₹{(walletBalance ?? 0).toLocaleString('en-IN')}</strong>. Add funds to continue.
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {[500, 1000, 2000].map(amt => (
                <button key={amt} type="button" onClick={() => setAddAmount(String(amt))}
                  style={{ padding: '10px 0', borderRadius: 12, border: `1.5px solid ${addAmount === String(amt) ? 'var(--brand-primary)' : 'var(--bg-border)'}`, background: addAmount === String(amt) ? 'rgba(109,40,217,0.07)' : 'var(--bg-input)', color: addAmount === String(amt) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 16 }}>₹</span>
              <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="Enter custom amount" min={100}
                className="input" style={{ paddingLeft: 32 }} />
            </div>

            <button type="button" onClick={addFunds} disabled={addingFunds || !addAmount}
              className="btn btn-primary" style={{ width: '100%', fontSize: 15, fontWeight: 800, padding: '14px 0', marginBottom: 10 }}>
              {addingFunds ? 'Adding funds...' : `Add ₹${addAmount ? Number(addAmount).toLocaleString('en-IN') : '—'} & Publish Gig`}
            </button>
            <button type="button" onClick={() => setShowAddFunds(false)}
              style={{ width: '100%', padding: '10px 0', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
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
