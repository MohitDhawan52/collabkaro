'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const NICHES = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Gaming', 'Finance', 'Education', 'Comedy', 'Music', 'Art', 'Sports', 'Parenting']
const DELIVERABLES = ['Instagram Post', 'Instagram Reel', 'Instagram Story', 'YouTube Video', 'YouTube Short', 'Facebook Post', 'Blog Post', 'Twitter/X Post']

export default function CreateGig() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    collab_type: 'paid' as 'paid' | 'barter' | 'both',
    niche_required: [] as string[],
    min_followers: '',
    max_budget: '',
    deliverables: [] as string[],
    deadline: '',
  })

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const toggleArray = (field: 'niche_required' | 'deliverables', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(i => i !== value)
        : [...f[field], value]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!brand) { setError('Brand profile not found'); setLoading(false); return }

    const { error } = await supabase.from('gigs').insert({
      brand_id: brand.id,
      title: form.title,
      description: form.description,
      collab_type: form.collab_type,
      niche_required: form.niche_required,
      min_followers: parseInt(form.min_followers) || 0,
      max_budget: parseFloat(form.max_budget) || 0,
      deliverables: form.deliverables,
      deadline: form.deadline || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/brand')
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
  const inputStyle = { background: '#1e1e2e', border: '1px solid #2a2a3a' }
  const labelClass = "block text-sm font-medium mb-2"
  const labelStyle = { color: '#9ca3af' }

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard/brand" className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create a <span className="gradient-text">Gig</span></h1>
            <p style={{ color: '#9ca3af' }}>Define your collaboration requirements</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-400 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-8 flex flex-col gap-6">
          <div>
            <label className={labelClass} style={labelStyle}>Campaign Title *</label>
            <input className={inputClass} style={inputStyle} value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="e.g. Summer Collection Launch with Fashion Influencers" required />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Campaign Description *</label>
            <textarea className={inputClass} style={inputStyle} value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Describe what the collaboration is about, what you expect from influencers..."
              rows={4} required />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Collaboration Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {(['paid', 'barter', 'both'] as const).map(type => (
                <button key={type} type="button" onClick={() => update('collab_type', type)}
                  className="py-3 rounded-xl font-semibold capitalize transition-all"
                  style={form.collab_type === type
                    ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                    : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                  {type === 'paid' ? '💰 Paid' : type === 'barter' ? '🔄 Barter' : '🤝 Both'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Niche Required</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {NICHES.map(n => (
                <button key={n} type="button" onClick={() => toggleArray('niche_required', n)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={form.niche_required.includes(n)
                    ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                    : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Deliverables Required</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DELIVERABLES.map(d => (
                <button key={d} type="button" onClick={() => toggleArray('deliverables', d)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={form.deliverables.includes(d)
                    ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                    : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Minimum Followers</label>
              <input className={inputClass} style={inputStyle} type="number"
                value={form.min_followers} onChange={e => update('min_followers', e.target.value)}
                placeholder="e.g. 10000" />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                {form.collab_type === 'barter' ? 'Product Value (₹)' : 'Max Budget (₹)'}
              </label>
              <input className={inputClass} style={inputStyle} type="number"
                value={form.max_budget} onChange={e => update('max_budget', e.target.value)}
                placeholder="e.g. 25000" />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>Campaign Deadline</label>
            <input className={inputClass} style={inputStyle} type="date"
              value={form.deadline} onChange={e => update('deadline', e.target.value)} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all text-lg">
            {loading ? 'Creating Gig...' : '🚀 Post Gig'}
          </button>
        </form>
      </div>
    </main>
  )
}