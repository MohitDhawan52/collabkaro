export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InfluencerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [pitches, setPitches] = useState<any[]>([])
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: prof } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!prof) { router.push('/onboarding/influencer'); return }
    setProfile(prof)

    const { data: pitchData } = await supabase
      .from('pitches')
      .select('*, gigs(*), brand_profiles(*)')
      .eq('influencer_id', prof.id)
      .order('created_at', { ascending: false })

    setPitches(pitchData || [])

    const { data: agreeData } = await supabase
      .from('agreements')
      .select('*')
      .eq('influencer_id', prof.id)
      .order('created_at', { ascending: false })

    setAgreements(agreeData || [])
    setLoading(false)
  }

  const handlePitch = async (pitchId: string, status: 'accepted' | 'rejected') => {
    await supabase.from('pitches').update({ status }).eq('id', pitchId)
    loadData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">⚡</div>
        <p style={{ color: '#9ca3af' }}>Loading your dashboard...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #2a2a3a' }}>
        <Link href="/" className="text-2xl font-bold gradient-text">CollabSphere</Link>
        <div className="flex items-center gap-4">
          <span style={{ color: '#9ca3af' }}>👋 {profile?.full_name}</span>
          <button onClick={handleLogout} className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Instagram Followers', value: profile?.instagram_followers?.toLocaleString() || '0', icon: '📸' },
            { label: 'YouTube Subscribers', value: profile?.youtube_subscribers?.toLocaleString() || '0', icon: '▶️' },
            { label: 'Total Pitches', value: pitches.length, icon: '📨' },
            { label: 'Active Collabs', value: agreements.filter(a => a.status === 'signed').length, icon: '🤝' },
          ].map((stat, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm mt-1" style={{ color: '#9ca3af' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pitches */}
          <div>
            <h2 className="text-2xl font-bold mb-5">📨 Brand Pitches</h2>
            {pitches.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p style={{ color: '#9ca3af' }}>No pitches yet. Complete your profile to attract brands!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pitches.map(pitch => (
                  <div key={pitch.id} className="card p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">{pitch.gigs?.title || 'Collaboration'}</h3>
                        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>{pitch.message}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: pitch.status === 'pending' ? 'rgba(234,179,8,0.15)' : pitch.status === 'accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: pitch.status === 'pending' ? '#eab308' : pitch.status === 'accepted' ? '#10b981' : '#ef4444'
                        }}>
                        {pitch.status}
                      </span>
                    </div>
                    {pitch.status === 'pending' && (
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => handlePitch(pitch.id, 'accepted')}
                          className="flex-1 py-2 rounded-xl text-white text-sm font-semibold gradient-bg hover:opacity-90 transition-all">
                          ✅ Accept
                        </button>
                        <button onClick={() => handlePitch(pitch.id, 'rejected')}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agreements */}
          <div>
            <h2 className="text-2xl font-bold mb-5">📄 Agreements</h2>
            {agreements.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p style={{ color: '#9ca3af' }}>No agreements yet. Accept a pitch to get started!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {agreements.map(agreement => (
                  <div key={agreement.id} className="card p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold">Agreement #{agreement.id.slice(0, 8)}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: agreement.status === 'signed' ? 'rgba(16,185,129,0.15)' : 'rgba(108,71,255,0.15)',
                          color: agreement.status === 'signed' ? '#10b981' : '#8b6dff'
                        }}>
                        {agreement.status}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: '#9ca3af' }}>
                      Amount: ₹{agreement.amount?.toLocaleString() || 'Barter'}
                    </p>
                    <Link href={`/agreements/${agreement.id}`}
                      className="block text-center py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#8b6dff' }}>
                      View Agreement →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="card p-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Profile</h2>
            <Link href="/onboarding/influencer"
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#8b6dff' }}>
              Edit Profile
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Niche', value: profile?.niche?.join(', ') || 'Not set' },
              { label: 'Location', value: profile?.location || 'Not set' },
              { label: 'Reel Rate', value: profile?.commercial_reel ? `₹${profile.commercial_reel}` : 'Not set' },
              { label: 'Engagement', value: profile?.instagram_engagement_rate ? `${profile.instagram_engagement_rate}%` : 'Not set' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#1e1e2e' }}>
                <div className="text-xs mb-1" style={{ color: '#6b7280' }}>{item.label}</div>
                <div className="font-semibold text-sm">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}