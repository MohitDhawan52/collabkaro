'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, AtSign, Play, MapPin, X, Users, SlidersHorizontal, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NICHES } from '@/types/index'

interface Influencer {
  id: string
  user_id: string
  full_name: string
  bio: string | null
  location: string | null
  niche: string[]
  barter_open: boolean
  instagram_handle: string | null
  instagram_followers: number | null
  instagram_engagement_rate: number | null
  instagram_reel_price: number | null
  instagram_verified?: boolean
  youtube_channel: string | null
  youtube_subscribers: number | null
  avg_rating?: number | null
  review_count?: number
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

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FF5533,#FF8A00)',
  'linear-gradient(135deg,#8B5CF6,#EC4899)',
  'linear-gradient(135deg,#06B6D4,#3B82F6)',
  'linear-gradient(135deg,#10B981,#06B6D4)',
  'linear-gradient(135deg,#F59E0B,#EF4444)',
  'linear-gradient(135deg,#6366F1,#8B5CF6)',
]

function getGradient(name: string) {
  const i = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[i]
}

export default function BrowseInfluencersPage() {
  const [all, setAll] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All')
  const [minFollowers, setMinFollowers] = useState(0)
  const [barterOnly, setBarterOnly] = useState(false)
  const [collabFilter, setCollabFilter] = useState<'all' | 'paid' | 'barter' | 'both'>('all')
  const [location, setLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'followers' | 'recent'>('followers')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: approvedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'influencer')
        .eq('status', 'approved')

      const approvedIds = (approvedProfiles ?? []).map(p => p.id)
      if (!approvedIds.length) { setLoading(false); return }

      const { data } = await supabase
        .from('influencer_profiles')
        .select('id, user_id, full_name, bio, location, niche, barter_open, collab_open, instagram_handle, instagram_followers, instagram_engagement_rate, instagram_reel_price, instagram_verified, youtube_channel, youtube_subscribers')
        .in('user_id', approvedIds)
        .order('instagram_followers', { ascending: false, nullsFirst: false })

      const influencers = (data as Influencer[]) ?? []

      const userIds = influencers.map(i => i.user_id)
      if (userIds.length > 0) {
        const { data: ratingData } = await supabase
          .from('reviews')
          .select('reviewee_id, rating')
          .eq('reviewee_role', 'influencer')
          .in('reviewee_id', userIds)

        const ratingMap: Record<string, { total: number; count: number }> = {}
        for (const r of ratingData ?? []) {
          if (!ratingMap[r.reviewee_id]) ratingMap[r.reviewee_id] = { total: 0, count: 0 }
          ratingMap[r.reviewee_id].total += r.rating
          ratingMap[r.reviewee_id].count += 1
        }
        for (const inf of influencers) {
          const rm = ratingMap[inf.user_id]
          inf.avg_rating = rm ? rm.total / rm.count : null
          inf.review_count = rm?.count ?? 0
        }
      }

      setAll(influencers)
      setLoading(false)
    }
    load()
  }, [])

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
      if (collabFilter !== 'all') {
        if (collabFilter === 'paid' && !['paid', 'both'].includes(inf.collab_open ?? '')) return false
        if (collabFilter === 'barter' && !['barter', 'both'].includes(inf.collab_open ?? '')) return false
        if (collabFilter === 'both' && inf.collab_open !== 'both') return false
      }
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

  const activeFilterCount = selectedNiches.length + (selectedPlatform !== 'All' ? 1 : 0) + (minFollowers > 0 ? 1 : 0) + (collabFilter !== 'all' ? 1 : 0) + (location ? 1 : 0)

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif", letterSpacing: -0.6, margin: 0 }}>
          Browse Creators
        </h1>
        <p style={{ fontSize: 14, color: '#6B6B78', marginTop: 5, margin: '5px 0 0' }}>
          {loading ? 'Loading creators…' : <><strong style={{ color: '#111113' }}>{filtered.length}</strong> creators available to collaborate with</>}
        </p>
      </div>

      {/* Search + controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            placeholder="Search by name, niche, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12, border: '1.5px solid #E6E4DE', background: '#fff', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', color: '#111113', fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: showFilters ? '1.5px solid #FF5533' : '1.5px solid #E6E4DE', background: showFilters ? 'rgba(255,85,51,0.06)' : '#fff', fontSize: 13.5, fontWeight: 600, color: showFilters ? '#FF5533' : '#374151', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.14s' }}>
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: '#FF5533', color: '#fff', fontSize: 10.5, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'followers' | 'recent')}
          style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #E6E4DE', background: '#fff', fontSize: 13.5, color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
          <option value="followers">Most Followers</option>
          <option value="recent">Recently Joined</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background: '#fff', border: '1.5px solid #E6E4DE', borderRadius: 16, padding: '20px 24px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 20 }}>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B78', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Platform</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['All', 'Instagram', 'YouTube'].map(p => (
                  <button key={p} onClick={() => setSelectedPlatform(p)}
                    style={{ padding: '6px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1.5px solid', borderColor: selectedPlatform === p ? '#FF5533' : '#E6E4DE', background: selectedPlatform === p ? '#FF5533' : '#fff', color: selectedPlatform === p ? '#fff' : '#374151', transition: 'all 0.12s', fontFamily: "'DM Sans', sans-serif" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B78', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Min Followers</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FOLLOWER_RANGES.map(r => (
                  <button key={r.label} onClick={() => setMinFollowers(r.min)}
                    style={{ padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1.5px solid', borderColor: minFollowers === r.min ? '#FF5533' : '#E6E4DE', background: minFollowers === r.min ? 'rgba(255,85,51,0.08)' : '#fff', color: minFollowers === r.min ? '#FF5533' : '#374151', transition: 'all 0.12s', fontFamily: "'DM Sans', sans-serif" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B78', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Location</div>
              <div style={{ position: 'relative' }}>
                <MapPin size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input placeholder="e.g. Mumbai, Delhi…" value={location} onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 28px', borderRadius: 10, border: '1.5px solid #E6E4DE', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B78', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Collab Type</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {([
                  { value: 'all', label: 'All' },
                  { value: 'paid', label: '💰 Paid' },
                  { value: 'barter', label: '🎁 Barter' },
                  { value: 'both', label: '🤝 Both' },
                ] as const).map(opt => (
                  <button key={opt.value} onClick={() => setCollabFilter(opt.value)}
                    style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1.5px solid',
                      borderColor: collabFilter === opt.value ? '#FF5533' : '#E6E4DE',
                      background: collabFilter === opt.value ? 'rgba(255,85,51,0.08)' : '#fff',
                      color: collabFilter === opt.value ? '#FF5533' : '#374151',
                      transition: 'all 0.12s', fontFamily: "'DM Sans', sans-serif" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6B78', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Niche</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {NICHES.map(n => {
                const active = selectedNiches.includes(n)
                return (
                  <button key={n} onClick={() => toggleNiche(n)}
                    style={{ padding: '5px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1.5px solid', borderColor: active ? '#FF5533' : '#E6E4DE', background: active ? '#FF5533' : '#fff', color: active ? '#fff' : '#374151', transition: 'all 0.12s', fontFamily: "'DM Sans', sans-serif" }}>
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={() => { setSelectedNiches([]); setSelectedPlatform('All'); setMinFollowers(0); setBarterOnly(false); setLocation('') }}
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#EF4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              <X size={13} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 220, borderRadius: 16, background: '#fff', border: '1.5px solid #E6E4DE' }}
              className="shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #E6E4DE', borderRadius: 18, padding: '64px 24px', textAlign: 'center' }}>
          <Users size={36} style={{ color: '#D1D5DB', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>No creators match your filters</div>
          <div style={{ fontSize: 13.5, color: '#9CA3AF', marginTop: 5 }}>Try adjusting or clearing some filters.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {filtered.map(inf => {
            const igFollowers = fmt(inf.instagram_followers)
            const ytSubs = fmt(inf.youtube_subscribers)
            const initials = inf.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'I'
            const grad = getGradient(inf.full_name ?? 'A')

            return (
              <Link key={inf.id} href={`/brand/influencers/${inf.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: '#fff', border: '1.5px solid #E6E4DE', borderRadius: 18, padding: '20px', cursor: 'pointer', transition: 'all 0.16s', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 10px 32px rgba(0,0,0,0.10)'; el.style.borderColor = '#FF5533' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.boxShadow = 'none'; el.style.borderColor = '#E6E4DE' }}>

                  {/* Avatar + name row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: '#111113', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inf.full_name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {inf.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#6B6B78' }}>
                            <MapPin size={11} /> {inf.location}
                          </span>
                        )}
                        {inf.avg_rating != null && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>
                            <Star size={10} fill="#F59E0B" /> {inf.avg_rating.toFixed(1)}
                            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({inf.review_count})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                      {inf.collab_open && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
                          ...(inf.collab_open === 'paid' ? { background: 'rgba(255,85,51,0.10)', color: '#FF5533', border: '1px solid rgba(255,85,51,0.25)' }
                            : inf.collab_open === 'barter' ? { background: 'rgba(16,185,129,0.10)', color: '#059669', border: '1px solid rgba(16,185,129,0.22)' }
                            : { background: 'rgba(234,179,8,0.10)', color: '#B45309', border: '1px solid rgba(234,179,8,0.25)' }) }}>
                          {inf.collab_open === 'paid' ? '💰 Paid' : inf.collab_open === 'barter' ? '🎁 Barter' : '🤝 Paid & Barter'}
                        </span>
                      )}
                      {inf.instagram_verified && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(131,58,180,0.08)', color: '#7C3AED', border: '1px solid rgba(131,58,180,0.18)', whiteSpace: 'nowrap' }}>
                          IG Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {inf.bio ? (
                    <p style={{ fontSize: 12.5, color: '#6B6B78', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {inf.bio}
                    </p>
                  ) : <div />}

                  {/* Platform stats */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {igFollowers && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 10, background: '#FFF7F5', border: '1px solid rgba(255,85,51,0.15)', fontSize: 12.5, fontWeight: 600, color: '#FF5533' }}>
                        <AtSign size={13} /> {igFollowers}
                        {inf.instagram_engagement_rate && (
                          <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 11 }}>· {inf.instagram_engagement_rate}%</span>
                        )}
                      </div>
                    )}
                    {ytSubs && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 10, background: '#FFF5F5', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12.5, fontWeight: 600, color: '#DC2626' }}>
                        <Play size={13} /> {ytSubs}
                      </div>
                    )}
                    {inf.instagram_reel_price && (
                      <div style={{ padding: '6px 11px', borderRadius: 10, background: '#F8F7F3', border: '1px solid #E6E4DE', fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                        Reel {formatINR(inf.instagram_reel_price)}
                      </div>
                    )}
                  </div>

                  {/* Niches */}
                  {(inf.niche ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(inf.niche ?? []).slice(0, 3).map(n => (
                        <span key={n} style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: selectedNiches.includes(n) ? 'rgba(255,85,51,0.10)' : '#F3F2EE', color: selectedNiches.includes(n) ? '#FF5533' : '#6B6B78', border: `1px solid ${selectedNiches.includes(n) ? 'rgba(255,85,51,0.25)' : '#E6E4DE'}` }}>
                          {n}
                        </span>
                      ))}
                      {(inf.niche ?? []).length > 3 && (
                        <span style={{ fontSize: 11.5, color: '#9CA3AF', padding: '3px 0' }}>
                          +{(inf.niche ?? []).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
