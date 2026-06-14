export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const NICHES = ['All', 'Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Gaming', 'Finance', 'Education', 'Comedy', 'Music', 'Art', 'Sports']

export default function Discover() {
  const router = useRouter()
  const [influencers, setInfluencers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNiche, setSelectedNiche] = useState('All')
  const [minFollowers, setMinFollowers] = useState('')
  const [pitchModal, setPitchModal] = useState<any>(null)
  const [pitchMessage, setPitchMessage] = useState('')
  const [selectedGig, setSelectedGig] = useState('')
  const [pitching, setPitching] = useState(false)
  const [brandProfile, setBrandProfile] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    let result = influencers
    if (selectedNiche !== 'All') {
      result = result.filter(inf => inf.niche?.includes(selectedNiche))
    }
    if (minFollowers) {
      result = result.filter(inf =>
        (inf.instagram_followers || 0) + (inf.youtube_subscribers || 0) >= parseInt(minFollowers)
      )
    }
    setFiltered(result)
  }, [selectedNiche, minFollowers, influencers])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: brand } = await supabase
      .from('brand_profiles').select('*').eq('user_id', user.id).single()
    setBrandProfile(brand)

    const { data: infData } = await supabase
      .from('influencer_profiles').select('*').order('instagram_followers', { ascending: false })
    setInfluencers(infData || [])
    setFiltered(infData || [])

    if (brand) {
      const { data: gigData } = await supabase
        .from('gigs').select('*').eq('brand_id', brand.id).eq('status', 'active')
      setGigs(gigData || [])
    }
    setLoading(false)
  }

  const sendPitch = async () => {
    if (!selectedGig || !pitchMessage) return
    setPitching(true)

    await supabase.from('pitches').insert({
      gig_id: selectedGig,
      brand_id: brandProfile.id,
      influencer_id: pitchModal.id,
      message: pitchMessage,
    })

    setPitchModal(null)
    setPitchMessage('')
    setSelectedGig('')
    setPitching(false)
    alert('✅ Pitch sent successfully!')
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p style={{ color: '#9ca3af' }}>Finding influencers...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2a2a3a' }}>
        <Link href="/" className="text-2xl font-bold gradient-text">CollabSphere</Link>
        <Link href="/dashboard/brand" className="px-4 py-2 rounded-xl text-sm transition-all"
          style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Discover <span className="gradient-text">Influencers</span></h1>
          <p style={{ color: '#9ca3af' }}>Find the perfect influencer for your campaign</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-3 block" style={{ color: '#9ca3af' }}>Filter by Niche</label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map(n => (
                  <button key={n} onClick={() => setSelectedNiche(n)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={selectedNiche === n
                      ? { background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', color: 'white' }
                      : { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block" style={{ color: '#9ca3af' }}>Minimum Total Followers</label>
                <input
                  type="number"
                  value={minFollowers}
                  onChange={e => setMinFollowers(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}
                />
              </div>
              <button onClick={() => { setSelectedNiche('All'); setMinFollowers('') }}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <p className="mb-6 text-sm" style={{ color: '#9ca3af' }}>
          Showing {filtered.length} influencer{filtered.length !== 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(inf => (
            <div key={inf.id} className="card p-6 hover:border-purple-500 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-xl font-bold">
                  {inf.full_name?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold">{inf.full_name}</h3>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>📍 {inf.location}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {inf.niche?.slice(0, 3).map((n: string) => (
                  <span key={n} className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(108,71,255,0.15)', color: '#8b6dff' }}>
                    {n}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {inf.instagram_followers > 0 && (
                  <div className="p-3 rounded-xl text-center" style={{ background: '#1e1e2e' }}>
                    <div className="text-sm font-bold gradient-text">{inf.instagram_followers?.toLocaleString()}</div>
                    <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>📸 Instagram</div>
                  </div>
                )}
                {inf.youtube_subscribers > 0 && (
                  <div className="p-3 rounded-xl text-center" style={{ background: '#1e1e2e' }}>
                    <div className="text-sm font-bold gradient-text">{inf.youtube_subscribers?.toLocaleString()}</div>
                    <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>▶️ YouTube</div>
                  </div>
                )}
              </div>

              {inf.commercial_reel > 0 && (
                <p className="text-sm mb-4" style={{ color: '#10b981' }}>
                  🎭 Reel from ₹{inf.commercial_reel?.toLocaleString()}
                </p>
              )}

              <button onClick={() => setPitchModal(inf)}
                className="w-full py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                🚀 Pitch Influencer
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No influencers found</h3>
            <p style={{ color: '#9ca3af' }}>Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pitch Modal */}
      {pitchModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="card p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Pitch to {pitchModal.full_name}</h2>
            <p className="mb-6 text-sm" style={{ color: '#9ca3af' }}>Send a collaboration request</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Select Gig *</label>
                <select value={selectedGig} onChange={e => setSelectedGig(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}>
                  <option value="">Choose a gig...</option>
                  {gigs.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
                {gigs.length === 0 && (
                  <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                    No active gigs. <Link href="/gigs/create" className="underline">Create one first</Link>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>Your Message *</label>
                <textarea
                  value={pitchMessage}
                  onChange={e => setPitchMessage(e.target.value)}
                  placeholder="Hi! We'd love to collaborate with you on our upcoming campaign..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPitchModal(null)}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all"
                  style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                  Cancel
                </button>
                <button onClick={sendPitch} disabled={pitching || !selectedGig || !pitchMessage}
                  className="flex-1 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all disabled:opacity-50">
                  {pitching ? 'Sending...' : '🚀 Send Pitch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}