'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BrandDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [gigs, setGigs] = useState<any[]>([])
  const [pitches, setPitches] = useState<any[]>([])
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth/login'; return }

    const user = session.user

    const { data: prof } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!prof) { window.location.href = '/onboarding/brand'; return }
    setProfile(prof)

    const { data: gigData } = await supabase
      .from('gigs')
      .select('*')
      .eq('brand_id', prof.id)
      .order('created_at', { ascending: false })
    setGigs(gigData || [])

    const { data: pitchData } = await supabase
      .from('pitches')
      .select('*, influencer_profiles(*), gigs(*)')
      .eq('brand_id', prof.id)
      .order('created_at', { ascending: false })
    setPitches(pitchData || [])

    const { data: agreementData } = await supabase
      .from('agreements')
      .select('*')
      .eq('brand_id', prof.id)
      .order('created_at', { ascending: false })
    setAgreements(agreementData || [])

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
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
          <span style={{ color: '#9ca3af' }}>🏢 {profile?.brand_name}</span>
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
            { label: 'Active Gigs', value: gigs.filter(g => g.status === 'active').length, icon: '📢' },
            { label: 'Total Pitches Sent', value: pitches.length, icon: '📨' },
            { label: 'Accepted Pitches', value: pitches.filter(p => p.status === 'accepted').length, icon: '✅' },
            { label: 'Agreements', value: agreements.length, icon: '📄' },
          ].map((stat, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm mt-1" style={{ color: '#9ca3af' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link href="/gigs/create" className="card p-6 flex items-center gap-4 hover:border-purple-500 transition-all">
            <div className="text-4xl">➕</div>
            <div>
              <h3 className="font-bold text-lg">Create New Gig</h3>
              <p className="text-sm" style={{ color: '#9ca3af' }}>Post a new collaboration campaign</p>
            </div>
          </Link>
          <Link href="/discover" className="card p-6 flex items-center gap-4 hover:border-purple-500 transition-all">
            <div className="text-4xl">🔍</div>
            <div>
              <h3 className="font-bold text-lg">Discover Influencers</h3>
              <p className="text-sm" style={{ color: '#9ca3af' }}>Find and pitch influencers</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gigs */}
          <div>
            <h2 className="text-2xl font-bold mb-5">📢 Your Gigs</h2>
            {gigs.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="mb-4" style={{ color: '#9ca3af' }}>No gigs yet. Create your first campaign!</p>
                <Link href="/gigs/create" className="px-6 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                  Create Gig
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {gigs.map(gig => (
                  <div key={gig.id} className="card p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{gig.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: gig.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                          color: gig.status === 'active' ? '#10b981' : '#6b7280'
                        }}>
                        {gig.status}
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: '#9ca3af' }}>{gig.description?.slice(0, 80)}...</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 rounded-lg" style={{ background: '#1e1e2e', color: '#8b6dff' }}>
                        {gig.collab_type}
                      </span>
                      {gig.max_budget && (
                        <span className="px-2 py-1 rounded-lg" style={{ background: '#1e1e2e', color: '#10b981' }}>
                          ₹{gig.max_budget?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pitches */}
          <div>
            <h2 className="text-2xl font-bold mb-5">📨 Sent Pitches</h2>
            {pitches.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="mb-4" style={{ color: '#9ca3af' }}>No pitches sent yet. Discover influencers!</p>
                <Link href="/discover" className="px-6 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all">
                  Find Influencers
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pitches.map(pitch => (
                  <div key={pitch.id} className="card p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold">{pitch.influencer_profiles?.full_name}</h3>
                        <p className="text-sm" style={{ color: '#9ca3af' }}>For: {pitch.gigs?.title}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: pitch.status === 'pending' ? 'rgba(234,179,8,0.15)' : pitch.status === 'accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: pitch.status === 'pending' ? '#eab308' : pitch.status === 'accepted' ? '#10b981' : '#ef4444'
                        }}>
                        {pitch.status}
                      </span>
                    </div>
                    {pitch.status === 'accepted' && (
                      <a href={`/agreements/create?pitch=${pitch.id}`}
                        className="block text-center mt-3 py-2 rounded-xl text-sm font-semibold gradient-bg text-white hover:opacity-90 transition-all">
                        Generate Agreement →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agreements */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-5">📄 Agreements</h2>
          {agreements.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p style={{ color: '#9ca3af' }}>No agreements yet. Generate one from an accepted pitch!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agreements.map(agr => (
                <div key={agr.id} className="card p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold">Agreement #{agr.id.slice(0, 8)}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: agr.status === 'signed' ? 'rgba(16,185,129,0.15)' :
                          agr.status === 'completed' ? 'rgba(108,71,255,0.15)' : 'rgba(234,179,8,0.15)',
                        color: agr.status === 'signed' ? '#10b981' :
                          agr.status === 'completed' ? '#8b6dff' : '#eab308'
                      }}>
                      {agr.status}
                    </span>
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
                    Amount: {agr.amount ? `₹${agr.amount.toLocaleString()}` : 'Barter'}
                  </p>
                  <a href={`/agreements/${agr.id}`}
                    className="block text-center py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#8b6dff' }}>
                    View Agreement →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}