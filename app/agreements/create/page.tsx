'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function CreateAgreementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pitchId = searchParams.get('pitch')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pitch, setPitch] = useState<any>(null)
  const [influencer, setInfluencer] = useState<any>(null)
  const [brand, setBrand] = useState<any>(null)

  const [form, setForm] = useState({
    amount: '',
    collab_type: 'paid',
    deliverables: [] as string[],
    deadline: '',
    terms: '',
  })

  const DELIVERABLES = ['Instagram Post', 'Instagram Reel', 'Instagram Story', 'YouTube Video', 'YouTube Short', 'Facebook Post']

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    if (!pitchId) { router.push('/dashboard/brand'); return }

    const { data: pitchData } = await supabase
      .from('pitches')
      .select('*, gigs(*)')
      .eq('id', pitchId)
      .single()

    if (!pitchData) { router.push('/dashboard/brand'); return }
    setPitch(pitchData)

    const { data: infData } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('id', pitchData.influencer_id)
      .single()
    setInfluencer(infData)

    const { data: brandData } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', pitchData.brand_id)
      .single()
    setBrand(brandData)

    setForm(f => ({
      ...f,
      collab_type: pitchData.gigs?.collab_type || 'paid',
      deliverables: pitchData.gigs?.deliverables || [],
      terms: `1. The Influencer agrees to create and publish the agreed deliverables by the deadline.\n2. The Brand agrees to provide all necessary materials, products, and briefs on time.\n3. Content must be original and comply with platform guidelines.\n4. The Influencer must disclose the collaboration as per ASCI guidelines (#ad or #sponsored).\n5. Payment will be released within 3 business days after the Brand approves the deliverables.\n6. Revisions: Up to 2 rounds of revisions are included.\n7. Exclusivity: The Influencer agrees not to promote direct competitors for 30 days.\n8. In case of cancellation by the Brand, 50% of the agreed amount will be paid to the Influencer.\n9. In case of cancellation by the Influencer, no payment will be made and the Brand will receive a full refund.\n10. Any disputes will be resolved through mutual negotiation first.`
    }))

    setLoading(false)
  }

  const toggleDeliverable = (d: string) => {
    setForm(f => ({
      ...f,
      deliverables: f.deliverables.includes(d)
        ? f.deliverables.filter(i => i !== d)
        : [...f.deliverables, d]
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')

    const { data, error } = await supabase.from('agreements').insert({
      pitch_id: pitchId,
      brand_id: pitch.brand_id,
      influencer_id: pitch.influencer_id,
      amount: parseFloat(form.amount) || 0,
      collab_type: form.collab_type,
      deliverables: form.deliverables,
      terms: form.terms,
      status: 'draft',
    }).select().single()

    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/agreements/${data.id}`)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
  const inputStyle = { background: '#1e1e2e', border: '1px solid #2a2a3a' }
  const labelClass = "block text-sm font-medium mb-2"
  const labelStyle = { color: '#9ca3af' }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">📄</div>
        <p style={{ color: '#9ca3af' }}>Loading agreement details...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard/brand" className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Generate <span className="gradient-text">Agreement</span></h1>
            <p style={{ color: '#9ca3af' }}>Create a legally binding collaboration agreement</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-400 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        {/* Parties */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📋 Parties Involved</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: '#1e1e2e' }}>
              <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>BRAND</p>
              <p className="font-bold">{brand?.brand_name}</p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>{brand?.industry}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#1e1e2e' }}>
              <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>INFLUENCER</p>
              <p className="font-bold">{influencer?.full_name}</p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>{influencer?.niche?.join(', ')}</p>
            </div>
          </div>
        </div>

        <div className="card p-8 flex flex-col gap-6">
          {/* Collab Type */}
          <div>
            <label className={labelClass} style={labelStyle}>Collaboration Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(['paid', 'barter', 'both'] as const).map(type => (
                <button key={type} type="button" onClick={() => setForm(f => ({ ...f, collab_type: type }))}
                  className="py-3 rounded-xl font-semibold capitalize transition-all"
                  style={form.collab_type === type
                    ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                    : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                  {type === 'paid' ? '💰 Paid' : type === 'barter' ? '🔄 Barter' : '🤝 Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          {form.collab_type !== 'barter' && (
            <div>
              <label className={labelClass} style={labelStyle}>Payment Amount (₹) *</label>
              <input className={inputClass} style={inputStyle} type="number"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 15000" />
            </div>
          )}

          {/* Deliverables */}
          <div>
            <label className={labelClass} style={labelStyle}>Deliverables *</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DELIVERABLES.map(d => (
                <button key={d} type="button" onClick={() => toggleDeliverable(d)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={form.deliverables.includes(d)
                    ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                    : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className={labelClass} style={labelStyle}>Delivery Deadline *</label>
            <input className={inputClass} style={inputStyle} type="date"
              value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>

          {/* Terms */}
          <div>
            <label className={labelClass} style={labelStyle}>Terms & Conditions</label>
            <textarea className={inputClass} style={inputStyle}
              value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
              rows={10} />
            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
              These are auto-generated standard terms. You can edit them as needed.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full py-4 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all text-lg">
            {saving ? 'Generating...' : '📄 Generate Agreement'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function CreateAgreement() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      </main>
    }>
      <CreateAgreementContent />
    </Suspense>
  )
}