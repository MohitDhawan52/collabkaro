'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const INDUSTRIES = ['Fashion', 'Beauty', 'Technology', 'Food & Beverage', 'Health & Fitness', 'Travel', 'Finance', 'Education', 'Gaming', 'Home & Decor', 'Automobile', 'Entertainment', 'Sports', 'Baby & Kids', 'Pets']

export default function BrandOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    brand_name: '',
    industry: '',
    website: '',
    description: '',
    contact_name: '',
    contact_phone: '',
  })

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    const { error } = await supabase.from('brand_profiles').insert({
      user_id: user.id,
      brand_name: form.brand_name,
      industry: form.industry,
      website: form.website,
      description: form.description,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Set Up Your <span className="gradient-text">Brand Profile</span></h1>
          <p style={{ color: '#9ca3af' }}>Complete your profile to find the perfect influencers</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2].map(s => (
            <div key={s} className="flex-1 h-2 rounded-full transition-all"
              style={{ background: s <= step ? 'linear-gradient(135deg, #6c47ff, #ff47a3)' : '#2a2a3a' }} />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-400 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <div className="card p-8">
          {/* Step 1 - Brand Details */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold mb-2">Brand Details 🏢</h2>
              <div>
                <label className={labelClass} style={labelStyle}>Brand Name *</label>
                <input className={inputClass} style={inputStyle} value={form.brand_name}
                  onChange={e => update('brand_name', e.target.value)} placeholder="e.g. Mamaearth" />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Industry *</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {INDUSTRIES.map(ind => (
                    <button key={ind} onClick={() => update('industry', ind)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={form.industry === ind
                        ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                        : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Website</label>
                <input className={inputClass} style={inputStyle} value={form.website}
                  onChange={e => update('website', e.target.value)} placeholder="https://yourbrand.com" />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Brand Description *</label>
                <textarea className={inputClass} style={inputStyle} value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Tell influencers about your brand, products, and values..."
                  rows={4} />
              </div>
            </div>
          )}

          {/* Step 2 - Contact Details */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold mb-2">Contact Details 📞</h2>
              <div>
                <label className={labelClass} style={labelStyle}>Contact Person Name *</label>
                <input className={inputClass} style={inputStyle} value={form.contact_name}
                  onChange={e => update('contact_name', e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Contact Phone *</label>
                <input className={inputClass} style={inputStyle} value={form.contact_phone}
                  onChange={e => update('contact_phone', e.target.value)} placeholder="+91 9876543210" />
              </div>

              {/* Summary */}
              <div className="p-5 rounded-xl mt-2" style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)' }}>
                <h3 className="font-semibold mb-3 text-purple-400">Profile Summary</h3>
                <div className="flex flex-col gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <p>🏢 {form.brand_name || 'Not set'}</p>
                  <p>🏭 {form.industry || 'Not set'}</p>
                  <p>🌐 {form.website || 'Not set'}</p>
                  <p>👤 Contact: {form.contact_name || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                ← Back
              </button>
            ) : <div />}
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-8 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="px-8 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                {loading ? 'Saving...' : '🚀 Complete Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}