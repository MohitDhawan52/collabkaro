'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, AtSign, Play, MapPin, ChevronDown, X, Users, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NICHES } from '@/types/index'

interface Influencer {
  id: string
  full_name: string
  bio: string | null
  location: string | null
  niche: string[]
  barter_open: boolean
  instagram_handle: string | null
  instagram_followers: number | null
  instagram_engagement_rate: number | null
  instagram_reel_price: number | null
  youtube_channel: string | null
  youtube_subscribers: number | null
}

function fmt(n: number | null | undefined) {
  if (!n) return null
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatINR(n: number | null | undefined) {
  if (!n) return null
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

const FOLLOWER_RANGES = [
  { label: 'Any', min: 0 },
  { label: '1K+', min: 1000 },
  { label: '10K+', min: 10000 },
  { label: '50K+', min: 50000 },
  { label: '100K+', min: 100000 },
  { label: '500K+', min: 500000 },
  { label: '1M+', min: 1000000 },
]

const PLATFORMS = ['Instagram', 'YouTube']

export default function BrowseInfluencersPage() {
  const [all, setAll] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All')
  const [minFollowers, setMinFollowers] = useState(0)
  const [barterOnly, setBarterOnly] = useState(false)
  const [location, setLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'followers' | 'recent'>('followers')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      // Only fetch approved influencers
      const { data: approvedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'influencer')
        .eq('status', 'approved')

      const approvedIds = (approvedProfiles ?? []).map(p => p.id)
      if (!approvedIds.length) { setLoading(false); return }

      const { data } = await supabase
        .from('influencer_profiles')
        .select('id, full_name, bio, location, niche, barter_open, instagram_handle, instagram_followers, instagram_engagement_rate, instagram_reel_price, youtube_channel, youtube_subscribers')
        .in('user_id', approvedIds)
        .order('instagram_followers', { ascending: false, nullsFirst: false })

      setAll((data as Influencer[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Filters applied client-side
  const filtered = all
    .filter(inf => {
      if (search) {
        const q = search.toLowerCase()
        if (!inf.full_name?.toLowerCase().includes(q) &&
            !inf.bio?.toLowerCase().includes(q) &&
            !inf.location?.toLowerCase().includes(q) &&
            !(inf.niche ?? []).some(n => n.toLowerCase().includes(q))) return false
      }
      if (selectedNiches.length > 0 && !selectedNiches.some(n => (inf.niche ?? []).includes(n))) return false
      if (selectedPlatform === 'Instagram' && !inf.instagram_handle) return false
      if (selectedPlatform === 'YouTube' && !inf.youtube_channel) return false
      if (barterOnly && !inf.barter_open) return false
      if (location && !inf.location?.toLowerCase().includes(location.toLowerCase())) return false
      const totalFollowers = Math.max(inf.instagram_followers ?? 0, inf.youtube_subscribers ?? 0)
      if (minFollowers > 0 && totalFollowers < minFollowers) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'followers') {
        const aF = Math.max(a.instagram_followers ?? 0, a.youtube_subscribers ?? 0)
        const bF = Math.max(b.instagram_followers ?? 0, b.youtube_subscribers ?? 0)
        return bF - aF
      }
      return 0
    })

  function toggleNiche(n: string) {
    setSelectedNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  const activeFilterCount = selectedNiches.length + (selectedPlatform !== 'All' ? 1 : 0) + (minFollowers > 0 ? 1 : 0) + (barterOnly ? 1 : 0) + (location ? 1 : 0)

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -0.4 }}>Browse Influencers</div>
      <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4, marginBottom: 24 }}>
        Discover and connect with creators that match your brand. {!loading && <strong style={{ color: '#0c1445' }}>{filtered.length}</strong>} {!loading && 'creators found.'}
      </div>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            placeholder="Search by name, niche, location, bio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', color: '#0c1445' }}
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: showFilters ? '1.5px solid #1d4ed8' : '1px solid rgba(255,255,255,0.7)', background: showFilters ? 'rgba(29,78,216,0.08)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', fontSize: 13.5, fontWeight: 600, color: showFilters ? '#1d4ed8' : '#374151', cursor: 'pointer' }}>
          <SlidersHorizontal size={15} /> Filters
          {activeFilterCount > 0 && <span style={{ background: '#1d4ed8', color: '#fff', fontSize: 11, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>}
        </button>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'followers' | 'recent')}
          style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.7)', fontSize: 13.5, color: '#374151', cursor: 'pointer', outline: 'none' }}>
          <option value="followers">Sort: Most Followers</option>
          <option value="recent">Sort: Recently Joined</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 18, padding: '20px 24px', backdropFilter: 'blur(14px)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>

            {/* Platform */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Platform</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['All', 'Instagram', 'YouTube'].map(p => (
                  <button key={p} onClick={() => setSelectedPlatform(p)}
                    style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: selectedPlatform === p ? 'linear-gradient(135deg,#1d4ed8,#06b6d4)' : 'rgba(0,0,0,0.06)', color: selectedPlatform === p ? '#fff' : '#374151' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Min followers */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Min Followers</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FOLLOWER_RANGES.map(r => (
                  <button key={r.label} onClick={() => setMinFollowers(r.min)}
                    style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: minFollowers === r.min ? 'linear-gradient(135deg,#a855f7,#ec4899)' : 'rgba(0,0,0,0.06)', color: minFollowers === r.min ? '#fff' : '#374151' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Location</div>
              <div style={{ position: 'relative' }}>
                <MapPin size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input placeholder="e.g. Mumbai, Delhi..." value={location} onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 28px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, background: 'rgba(255,255,255,0.8)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Barter toggle */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Collaboration Type</div>
              <button onClick={() => setBarterOnly(!barterOnly)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: barterOnly ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.06)', color: barterOnly ? '#059669' : '#374151' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: barterOnly ? 'none' : '2px solid #d1d5db', background: barterOnly ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {barterOnly && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                </div>
                Open to Barter
              </button>
            </div>
          </div>

          {/* Niches */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Niche</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {NICHES.map(n => {
                const active = selectedNiches.includes(n)
                return (
                  <button key={n} onClick={() => toggleNiche(n)}
                    style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: active ? 'none' : '1px solid rgba(0,0,0,0.1)', background: active ? 'linear-gradient(135deg,#1d4ed8,#a855f7)' : 'rgba(255,255,255,0.8)', color: active ? '#fff' : '#374151', transition: 'all 0.12s' }}>
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={() => { setSelectedNiches([]); setSelectedPlatform('All'); setMinFollowers(0); setBarterOnly(false); setLocation('') }}
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#dc2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={13} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 200, borderRadius: 18, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 20, padding: '60px 24px', textAlign: 'center', backdropFilter: 'blur(14px)' }}>
          <Users size={32} style={{ color: '#d1d5db', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0c1445' }}>No influencers match your filters</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 5 }}>Try adjusting your search or removing some filters.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map(inf => {
            const igFollowers = fmt(inf.instagram_followers)
            const ytSubs = fmt(inf.youtube_subscribers)
            const initials = inf.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'I'
            return (
              <Link key={inf.id} href={`/brand/influencers/${inf.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 20, padding: '20px', backdropFilter: 'blur(14px)', boxShadow: '0 2px 16px rgba(29,78,216,0.08)', cursor: 'pointer', transition: 'all 0.15s', height: '100%', boxSizing: 'border-box' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(29,78,216,0.14)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(29,78,216,0.08)' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inf.full_name}</div>
                      {inf.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          <MapPin size={11} /> {inf.location}
                        </div>
                      )}
                    </div>
                    {inf.barter_open && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>Barter ✓</span>
                    )}
                  </div>

                  {/* Bio */}
                  {inf.bio && (
                    <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {inf.bio}
                    </div>
                  )}

                  {/* Social stats */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    {igFollowers && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', fontSize: 12.5, fontWeight: 600, color: '#ea580c' }}>
                        <AtSign size={12} /> {igFollowers}
                        {inf.instagram_engagement_rate && <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>· {inf.instagram_engagement_rate}%</span>}
                      </div>
                    )}
                    {ytSubs && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', fontSize: 12.5, fontWeight: 600, color: '#dc2626' }}>
                        <Play size={12} /> {ytSubs}
                      </div>
                    )}
                    {inf.instagram_reel_price && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 10, background: 'rgba(29,78,216,0.06)', fontSize: 12.5, fontWeight: 600, color: '#1d4ed8' }}>
                        Reel {formatINR(inf.instagram_reel_price)}
                      </div>
                    )}
                  </div>

                  {/* Niches */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(inf.niche ?? []).slice(0, 3).map(n => (
                      <span key={n} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: selectedNiches.includes(n) ? 'rgba(29,78,216,0.15)' : 'rgba(168,85,247,0.08)', color: selectedNiches.includes(n) ? '#1d4ed8' : '#7c3aed', border: `1px solid ${selectedNiches.includes(n) ? 'rgba(29,78,216,0.3)' : 'rgba(168,85,247,0.15)'}` }}>{n}</span>
                    ))}
                    {(inf.niche ?? []).length > 3 && <span style={{ fontSize: 11, color: '#9ca3af', padding: '3px 0' }}>+{(inf.niche ?? []).length - 3} more</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
