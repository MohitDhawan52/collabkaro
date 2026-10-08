'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Sparkles, IndianRupee, Package, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NICHES, PLATFORMS } from '@/types/index'

const schema = z.object({
  client_brand_id: z.string().min(1, 'Select a client'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(30, 'Please write at least 30 characters'),
  collab_type: z.enum(['paid', 'barter', 'both'] as const),
  niche_required: z.array(z.string()).min(1, 'Select at least one niche'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  min_followers: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  influencer_limit: z.coerce.number().min(1).max(500),
  max_budget: z.union([z.coerce.number().min(1), z.literal('')]).optional(),
  deliverables: z.string().optional(),
  timeline: z.string().optional(),
  bulk_pack: z.boolean().optional(),
})

type GigForm = z.infer<typeof schema>

const STEPS = ['Client & Campaign', 'Audience & Platforms', 'Deliverables & Budget']

const DELIVERABLE_TYPES = [
  { id: 'ig_reel',   label: 'Instagram Reel',  emoji: '🎬' },
  { id: 'ig_post',   label: 'Instagram Post',  emoji: '📸' },
  { id: 'ig_story',  label: 'Instagram Story', emoji: '⭕' },
  { id: 'ig_live',   label: 'Instagram Live',  emoji: '🔴' },
  { id: 'yt_video',  label: 'YouTube Video',   emoji: '▶️' },
  { id: 'yt_short',  label: 'YouTube Short',   emoji: '⚡' },
  { id: 'tiktok',    label: 'TikTok Video',    emoji: '🎵' },
  { id: 'twitter',   label: 'Twitter/X Post',  emoji: '✖️' },
  { id: 'linkedin',  label: 'LinkedIn Post',   emoji: '💼' },
  { id: 'blog',      label: 'Blog Article',    emoji: '✍️' },
]

interface DeliverableItem { id: string; label: string; emoji: string; qty: number; due_date: string }
interface Client { id: string; brand_id: string; company_name: string }

// Single gig: ₹49 + 18% GST = ₹57.82
// Bulk pack (10 gigs): 10 × ₹49 × 0.70 = ₹343 base + 18% GST = ₹404.74
const SINGLE_FEE = 57.82
const BULK_BASE = 10 * 49 * 0.7
const BULK_TOTAL = Math.round(BULK_BASE * 1.18 * 100) / 100

function ChipSelect({ options, selected, onChange, max }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => {
            if (active) onChange(selected.filter(s => s !== opt))
            else if (!max || selected.length < max) onChange([...selected, opt])
          }} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: active ? '1.5px solid #7C3AED' : '1.5px solid #EBEBEB', background: active ? 'rgba(124,58,237,0.08)' : '#FAFAF9', color: active ? '#7C3AED' : '#6B7280', transition: 'all 0.14s ease' }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const errStyle: React.CSSProperties = { fontSize: 11.5, color: '#DC2626', marginTop: 4, display: 'block' }

export default function AgencyPostGigPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedBrandId = searchParams.get('brand_id')

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [agencyId, setAgencyId] = useState<string | null>(null)
  const [bulkPack, setBulkPack] = useState(false)
  const [gigCount, setGigCount] = useState(1)

  const { register, handleSubmit, control, watch, trigger, setValue, formState: { errors } } = useForm<GigForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { collab_type: 'paid', niche_required: [], platforms: [], influencer_limit: 1, client_brand_id: preselectedBrandId ?? '' },
  })

  const collabType = watch('collab_type')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
      if (!agency) return
      const aid = (agency as unknown as { id: string }).id
      setAgencyId(aid)
      const { data } = await supabase.from('agency_clients').select('id, brand_profiles(id, company_name)').eq('agency_id', aid)
      if (data) {
        setClients((data as unknown as { id: string; brand_profiles: { id: string; company_name: string } }[]).map(r => ({ id: r.id, brand_id: r.brand_profiles.id, company_name: r.brand_profiles.company_name })))
      }
    }
    load()
  }, [])

  function toggleDeliverable(type: typeof DELIVERABLE_TYPES[0]) {
    setDeliverables(prev => prev.find(d => d.id === type.id) ? prev.filter(d => d.id !== type.id) : [...prev, { ...type, qty: 1, due_date: '' }])
  }

  async function goNext() {
    let fields: (keyof GigForm)[] = []
    if (step === 0) fields = ['client_brand_id', 'title', 'description', 'collab_type']
    if (step === 1) fields = ['niche_required', 'platforms']
    if (step === 2) {
      if (deliverables.length === 0) { toast.error('Select at least one deliverable'); return }
      if (deliverables.some(d => !d.due_date)) { toast.error('Set a due date for every deliverable'); return }
    }
    const valid = await trigger(fields)
    if (valid) setStep(s => s + 1)
  }

  async function onSubmit(data: GigForm) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      if (deliverables.length === 0) { toast.error('Select at least one deliverable'); return }
      if (deliverables.some(d => !d.due_date)) { toast.error('Set a due date for every deliverable'); return }

      const count = bulkPack ? gigCount : 1
      const gigs = Array.from({ length: count }, (_, i) => ({
        brand_id: data.client_brand_id,
        agency_id: agencyId,
        title: count > 1 ? `${data.title} (${i + 1}/${count})` : data.title,
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
        gig_fee: bulkPack ? (49 * 0.7) : 49,
      }))

      const { error } = await supabase.from('gigs').insert(gigs)
      if (error) throw error

      toast.success(count > 1 ? `${count} gigs posted!` : 'Gig posted!')
      router.push('/agency/gigs')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const totalFee = bulkPack ? BULK_TOTAL : SINGLE_FEE

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/agency/gigs')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#6B7280', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}>
        <ArrowLeft size={15} /> {step > 0 ? 'Back' : 'All Gigs'}
      </button>

      <div className="dash-page-title">Post a Gig</div>
      <div className="dash-page-subtitle">Post on behalf of a client. Bulk pack saves 30%.</div>

      {/* Bulk pack toggle */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, marginBottom: 8 }}>
        <button type="button" onClick={() => setBulkPack(false)} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: !bulkPack ? '2px solid #7C3AED' : '1.5px solid #EBEBEB', background: !bulkPack ? 'rgba(124,58,237,0.06)' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.14s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <Sparkles size={13} color={!bulkPack ? '#7C3AED' : '#9CA3AF'} />
            <span style={{ fontSize: 13, fontWeight: 700, color: !bulkPack ? '#7C3AED' : '#374151' }}>Single Gig</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>₹49 + 18% GST = ₹57.82</div>
        </button>
        <button type="button" onClick={() => setBulkPack(true)} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: bulkPack ? '2px solid #7C3AED' : '1.5px solid #EBEBEB', background: bulkPack ? 'rgba(124,58,237,0.06)' : '#fff', cursor: 'pointer', textAlign: 'left', position: 'relative', transition: 'all 0.14s ease' }}>
          <div style={{ position: 'absolute', top: -8, right: 10, background: '#FF5533', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99, letterSpacing: 0.3 }}>30% OFF</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <Package size={13} color={bulkPack ? '#7C3AED' : '#9CA3AF'} />
            <span style={{ fontSize: 13, fontWeight: 700, color: bulkPack ? '#7C3AED' : '#374151' }}>Bulk Pack</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>Up to 10 gigs · ₹{BULK_TOTAL} total incl. GST</div>
        </button>
      </div>

      {bulkPack && (
        <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Zap size={14} color="#7C3AED" />
          <span style={{ fontSize: 13, color: '#5B21B6', fontWeight: 500 }}>How many gigs in this pack?</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={() => setGigCount(c => Math.max(2, c - 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid rgba(124,58,237,0.25)', background: '#fff', color: '#7C3AED', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED', minWidth: 20, textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>{gigCount}</span>
            <button type="button" onClick={() => setGigCount(c => Math.min(10, c + 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid rgba(124,58,237,0.25)', background: '#fff', color: '#7C3AED', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 28 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: i < step ? '#22c55e' : i === step ? '#7C3AED' : '#EBEBEB', color: i <= step ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {i < step ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? '#111113' : '#9CA3AF' }}>{label}</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: i <= step ? '#7C3AED' : '#EBEBEB' }} />
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 20, padding: '28px 24px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* STEP 0 */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Client *</label>
                <select {...register('client_brand_id')} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="">Select a client…</option>
                  {clients.map(c => <option key={c.brand_id} value={c.brand_id}>{c.company_name}</option>)}
                </select>
                {errors.client_brand_id && <span style={errStyle}>{errors.client_brand_id.message}</span>}
                {clients.length === 0 && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 5 }}>No clients linked yet. <a href="/agency/clients/new" style={{ color: '#7C3AED', fontWeight: 600 }}>Add a client first →</a></div>}
              </div>

              <div>
                <label style={labelStyle}>Campaign Title *</label>
                <input {...register('title')} placeholder="e.g. Summer Collection Launch with Lifestyle Creators" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                {errors.title && <span style={errStyle}>{errors.title.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Campaign Description *</label>
                <textarea {...register('description')} rows={5} placeholder="Describe the campaign goal, product, and kind of creator you're looking for…" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                {errors.description && <span style={errStyle}>{errors.description.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Collaboration Type *</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {(['paid', 'barter', 'both'] as const).map(type => (
                    <label key={type} style={{ flex: 1, padding: '12px 10px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, border: collabType === type ? '2px solid #7C3AED' : '1.5px solid #EBEBEB', background: collabType === type ? 'rgba(124,58,237,0.06)' : '#FAFAF9', color: collabType === type ? '#7C3AED' : '#6B7280', transition: 'all 0.14s ease' }}>
                      <input {...register('collab_type')} type="radio" value={type} style={{ display: 'none' }} />
                      {type === 'paid' && '💰 Paid'}
                      {type === 'barter' && '🤝 Barter'}
                      {type === 'both' && '✨ Both'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Niches Required * <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 400 }}>(select all that apply)</span></label>
                <Controller name="niche_required" control={control} render={({ field }) => (
                  <ChipSelect options={NICHES} selected={field.value} onChange={field.onChange} />
                )} />
                {errors.niche_required && <span style={errStyle}>{errors.niche_required.message}</span>}
              </div>

              <div>
                <label style={labelStyle}>Platforms *</label>
                <Controller name="platforms" control={control} render={({ field }) => (
                  <ChipSelect options={PLATFORMS} selected={field.value} onChange={field.onChange} />
                )} />
                {errors.platforms && <span style={errStyle}>{errors.platforms.message}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Min Followers</label>
                  <input {...register('min_followers')} type="number" placeholder="e.g. 5000" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={labelStyle}>Max Influencers</label>
                  <input {...register('influencer_limit')} type="number" placeholder="1" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Deliverables *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {DELIVERABLE_TYPES.map(type => {
                    const active = deliverables.find(d => d.id === type.id)
                    return (
                      <button key={type.id} type="button" onClick={() => toggleDeliverable(type)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: active ? '1.5px solid #7C3AED' : '1.5px solid #EBEBEB', background: active ? 'rgba(124,58,237,0.08)' : '#FAFAF9', color: active ? '#7C3AED' : '#6B7280', transition: 'all 0.14s ease' }}>
                        {type.emoji} {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {deliverables.map(d => (
                <div key={d.id} style={{ background: '#FAFAF9', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 12, alignItems: 'end' }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{d.emoji} {d.label}</div></div>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Qty</label>
                    <input type="number" min={1} value={d.qty} onChange={e => setDeliverables(prev => prev.map(x => x.id === d.id ? { ...x, qty: parseInt(e.target.value) || 1 } : x))} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1.5px solid #EBEBEB', fontSize: 13, background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Due Date *</label>
                    <input type="date" value={d.due_date} onChange={e => setDeliverables(prev => prev.map(x => x.id === d.id ? { ...x, due_date: e.target.value } : x))} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1.5px solid #EBEBEB', fontSize: 13, background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>
              ))}

              <div>
                <label style={labelStyle}>Max Budget (₹) {collabType === 'barter' ? '— optional' : ''}</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input {...register('max_budget')} type="number" placeholder={collabType === 'barter' ? 'Product value (optional)' : 'Total campaign budget'} style={{ width: '100%', padding: '11px 14px 11px 32px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* Fee summary */}
              <div style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#5B21B6', marginBottom: 6 }}>Gig Listing Fee</div>
                {bulkPack ? (
                  <>
                    <div style={{ fontSize: 12.5, color: '#6B7280' }}>{gigCount} gigs × ₹49 × 30% discount</div>
                    <div style={{ fontSize: 12.5, color: '#6B7280' }}>Base: ₹{(gigCount * 49 * 0.7).toFixed(2)} + 18% GST</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED', marginTop: 4, fontFamily: "'Outfit', sans-serif" }}>₹{(gigCount * 49 * 0.7 * 1.18).toFixed(2)} total</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12.5, color: '#6B7280' }}>₹49 + 18% GST</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED', marginTop: 4, fontFamily: "'Outfit', sans-serif" }}>₹57.82</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {step < 2 ? (
              <button type="button" onClick={goNext} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue →
              </button>
            ) : (
              <button type="submit" disabled={submitting} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: submitting ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Posting…' : bulkPack ? `Post ${gigCount} Gigs` : 'Post Gig'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
