export const dynamic = 'force-dynamic'
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const NICHES = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Gaming', 'Finance', 'Education', 'Comedy', 'Music', 'Art', 'Sports', 'Parenting']
const LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam']

export default function InfluencerOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    niche: [] as string[],
    languages: [] as string[],
    instagram_handle: '',
    instagram_followers: '',
    instagram_engagement_rate: '',
    youtube_channel: '',
    youtube_subscribers: '',
    youtube_avg_views: '',
    facebook_page: '',
    facebook_followers: '',
    commercial_photo: '',
    commercial_video: '',
    commercial_reel: '',
    commercial_story: '',
    past_brands: '',
  })

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const toggleArray = (field: 'niche' | 'languages', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(i => i !== value)
        : [...f[field], value]
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    const { error } = await supabase.from('influencer_profiles').insert({
      user_id: user.id,
      full_name: form.full_name,
      bio: form.bio,
      location: form.location,
      niche: form.niche,
      languages: form.languages,
      instagram_handle: form.instagram_handle,
      instagram_followers: parseInt(form.instagram_followers) || 0,
      instagram_engagement_rate: parseFloat(form.instagram_engagement_rate) || 0,
      youtube_channel: form.youtube_channel,
      youtube_subscribers: parseInt(form.youtube_subscribers) || 0,
      youtube_avg_views: parseInt(form.youtube_avg_views) || 0,
      facebook_page: form.facebook_page,
      facebook_followers: parseInt(form.facebook_followers) || 0,
      commercial_photo: parseFloat(form.commercial_photo) || 0,
      commercial_video: parseFloat(form.commercial_video) || 0,
      commercial_reel: parseFloat(form.commercial_reel) || 0,
      commercial_story: parseFloat(form.commercial_story) || 0,
      past_brands: form.past_brands.split(',').map(b => b.trim()).filter(Boolean),
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/influencer')
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
  const inputStyle = { background: '#1e1e2e', border: '1px solid #2a2a3a' }
  const labelClass = "block text-sm font-medium mb-2"
  const labelStyle = { color: '#9ca3af' }

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Set Up Your <span className="gradient-text">Influencer Profile</span></h1>
          <p style={{ color: '#9ca3af' }}>Complete your profile to start getting brand deals</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1 h-2 rounded-full transition-all" style={{ background: s <= step ? 'linear-gradient(135deg, #6c47ff, #ff47a3)' : '#2a2a3a' }} />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <div className="card p-8">
          {/* Step 1 - Basic Info */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
              <div>
                <label className={labelClass} style={labelStyle}>Full Name *</label>
                <input className={inputClass} style={inputStyle} value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Bio *</label>
                <textarea className={inputClass} style={inputStyle} value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Tell brands about yourself..." rows={4} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Location *</label>
                <input className={inputClass} style={inputStyle} value={form.location} onChange={e => update('location', e.target.value)} placeholder="City, State" />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Your Niche (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {NICHES.map(n => (
                    <button key={n} onClick={() => toggleArray('niche', n)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={form.niche.includes(n) ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' } : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Languages</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => toggleArray('languages', l)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                      style={form.languages.includes(l) ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' } : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Social Stats */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold mb-2">Social Media Stats</h2>
              <div className="p-5 rounded-xl" style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">📸 Instagram</h3>
                <div className="flex flex-col gap-3">
                  <input className={inputClass} style={inputStyle} value={form.instagram_handle} onChange={e => update('instagram_handle', e.target.value)} placeholder="@username" />
                  <input className={inputClass} style={inputStyle} type="number" value={form.instagram_followers} onChange={e => update('instagram_followers', e.target.value)} placeholder="Followers count" />
                  <input className={inputClass} style={inputStyle} type="number" value={form.instagram_engagement_rate} onChange={e => update('instagram_engagement_rate', e.target.value)} placeholder="Engagement rate % (e.g. 3.5)" />
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">▶️ YouTube</h3>
                <div className="flex flex-col gap-3">
                  <input className={inputClass} style={inputStyle} value={form.youtube_channel} onChange={e => update('youtube_channel', e.target.value)} placeholder="Channel name or URL" />
                  <input className={inputClass} style={inputStyle} type="number" value={form.youtube_subscribers} onChange={e => update('youtube_subscribers', e.target.value)} placeholder="Subscribers count" />
                  <input className={inputClass} style={inputStyle} type="number" value={form.youtube_avg_views} onChange={e => update('youtube_avg_views', e.target.value)} placeholder="Average views per video" />
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">👥 Facebook</h3>
                <div className="flex flex-col gap-3">
                  <input className={inputClass} style={inputStyle} value={form.facebook_page} onChange={e => update('facebook_page', e.target.value)} placeholder="Page name or URL" />
                  <input className={inputClass} style={inputStyle} type="number" value={form.facebook_followers} onChange={e => update('facebook_followers', e.target.value)} placeholder="Followers count" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Commercials */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold mb-2">Your Commercials 💰</h2>
              <p style={{ color: '#9ca3af' }}>Set your rates per deliverable (in ₹). Leave 0 if not available.</p>
              {[
                { label: 'Photo Post', field: 'commercial_photo', icon: '📸' },
                { label: 'Video Post', field: 'commercial_video', icon: '🎬' },
                { label: 'Reel / Short', field: 'commercial_reel', icon: '🎭' },
                { label: 'Story', field: 'commercial_story', icon: '⭕' },
              ].map(item => (
                <div key={item.field}>
                  <label className={labelClass} style={labelStyle}>{item.icon} {item.label} Rate (₹)</label>
                  <input className={inputClass} style={inputStyle} type="number" value={form[item.field as keyof typeof form] as string} onChange={e => update(item.field, e.target.value)} placeholder="e.g. 5000" />
                </div>
              ))}
            </div>
          )}

          {/* Step 4 - Past Brands */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-2xl font-bold mb-2">Past Experience 🏆</h2>
              <div>
                <label className={labelClass} style={labelStyle}>Brands You've Worked With</label>
                <textarea className={inputClass} style={inputStyle} value={form.past_brands} onChange={e => update('past_brands', e.target.value)} placeholder="Myntra, Mamaearth, Boat, Sugar Cosmetics (comma separated)" rows={4} />
                <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Separate brand names with commas</p>
              </div>
              <div className="p-5 rounded-xl" style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)' }}>
                <h3 className="font-semibold mb-3 text-purple-400">Profile Summary</h3>
                <div className="flex flex-col gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <p>👤 {form.full_name || 'Not set'}</p>
                  <p>📍 {form.location || 'Not set'}</p>
                  <p>🎯 {form.niche.join(', ') || 'Not set'}</p>
                  <p>📸 Instagram: {form.instagram_followers ? `${parseInt(form.instagram_followers).toLocaleString()} followers` : 'Not set'}</p>
                  <p>▶️ YouTube: {form.youtube_subscribers ? `${parseInt(form.youtube_subscribers).toLocaleString()} subscribers` : 'Not set'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-semibold transition-all" style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                ← Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-8 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                {loading ? 'Saving...' : '🚀 Complete Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}