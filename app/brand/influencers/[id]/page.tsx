'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, AtSign, Play, MapPin, Star, IndianRupee, Users, Briefcase, ExternalLink, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface InfluencerDetail {
  id: string
  full_name: string
  bio: string | null
  location: string | null
  niche: string[]
  instagram_handle: string | null
  instagram_followers: number | null
  instagram_engagement_rate: number | null
  instagram_post_price: number | null
  instagram_reel_price: number | null
  instagram_story_price: number | null
  youtube_channel: string | null
  youtube_subscribers: number | null
  youtube_avg_views: number | null
  youtube_dedicated_price: number | null
  barter_open: boolean
  brands_worked_with: string[]
  portfolio_links: string[]
}

function fmt(n: number | null | undefined) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatINR(n: number | null | undefined) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 20, padding: '22px 24px', backdropFilter: 'blur(14px)',
  boxShadow: '0 2px 16px rgba(29,78,216,0.08)', marginBottom: 16,
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 10px', background: 'rgba(29,78,216,0.05)', borderRadius: 14, flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0c1445' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function InfluencerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<InfluencerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [reviews, setReviews] = useState<{ rating: number; comment: string | null; created_at: string }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [profileRes, reviewsRes] = await Promise.all([
        supabase.from('influencer_profiles').select('*').eq('id', id).single(),
        supabase.from('reviews').select('rating, comment, created_at')
          .eq('reviewee_role', 'influencer')
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setProfile(profileRes.data as InfluencerDetail)

      // Filter reviews for this influencer via their user_id
      if (profileRes.data?.user_id) {
        const infReviews = (reviewsRes.data ?? []).filter(() => true) // filtered server-side below
        // Fetch reviews where reviewee_id = influencer's user_id
        const { data: infRev } = await supabase
          .from('reviews')
          .select('rating, comment, created_at')
          .eq('reviewee_id', profileRes.data.user_id)
          .eq('reviewee_role', 'influencer')
          .order('created_at', { ascending: false })
        const rv = infRev ?? []
        setReviews(rv)
        setReviewCount(rv.length)
        if (rv.length > 0) {
          setAvgRating(rv.reduce((s, r) => s + r.rating, 0) / rv.length)
        }
      }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  if (loading) return (
    <div style={{ maxWidth: 700 }}>
      {[1, 2, 3].map(i => <div key={i} style={{ height: 120, borderRadius: 20, background: 'rgba(255,255,255,0.5)', marginBottom: 16 }} />)}
    </div>
  )

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 16, color: '#6b7280' }}>Influencer profile not found.</div>
      <button onClick={() => router.back()} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        Go Back
      </button>
    </div>
  )

  const initials = profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'I'

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={15} /> Back to Pitches
      </button>

      {/* Hero card */}
      <div style={{ ...CARD, background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0c1445' }}>{profile.full_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {profile.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                  <MapPin size={13} /> {profile.location}
                </div>
              )}
              {avgRating !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  <Star size={14} fill="#f59e0b" />
                  {avgRating.toFixed(1)}
                  <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {(profile.niche ?? []).map(n => (
                <span key={n} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(168,85,247,0.12)', color: '#7c3aed', border: '1px solid rgba(168,85,247,0.2)' }}>{n}</span>
              ))}
              {profile.barter_open && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={10} /> Open to Barter
                </span>
              )}
            </div>
          </div>
        </div>
        {profile.bio && (
          <div style={{ marginTop: 16, fontSize: 13.5, color: '#374151', lineHeight: 1.6, padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: 12 }}>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Instagram */}
      {profile.instagram_handle && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AtSign size={17} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Instagram</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>@{profile.instagram_handle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatBox label="Followers" value={fmt(profile.instagram_followers)} />
            {profile.instagram_engagement_rate && <StatBox label="Engagement" value={`${profile.instagram_engagement_rate}%`} />}
          </div>
          {(profile.instagram_post_price || profile.instagram_reel_price || profile.instagram_story_price) && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pricing</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile.instagram_post_price && <div style={{ fontSize: 13, background: 'rgba(249,115,22,0.07)', borderRadius: 10, padding: '8px 14px' }}><span style={{ color: '#6b7280' }}>Post: </span><strong>{formatINR(profile.instagram_post_price)}</strong></div>}
                {profile.instagram_reel_price && <div style={{ fontSize: 13, background: 'rgba(249,115,22,0.07)', borderRadius: 10, padding: '8px 14px' }}><span style={{ color: '#6b7280' }}>Reel: </span><strong>{formatINR(profile.instagram_reel_price)}</strong></div>}
                {profile.instagram_story_price && <div style={{ fontSize: 13, background: 'rgba(249,115,22,0.07)', borderRadius: 10, padding: '8px 14px' }}><span style={{ color: '#6b7280' }}>Story: </span><strong>{formatINR(profile.instagram_story_price)}</strong></div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* YouTube */}
      {profile.youtube_channel && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={17} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>YouTube</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{profile.youtube_channel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatBox label="Subscribers" value={fmt(profile.youtube_subscribers)} />
            {profile.youtube_avg_views && <StatBox label="Avg Views" value={fmt(profile.youtube_avg_views)} />}
          </div>
          {profile.youtube_dedicated_price && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pricing</div>
              <div style={{ fontSize: 13, background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '8px 14px', display: 'inline-block' }}>
                <span style={{ color: '#6b7280' }}>Dedicated video: </span><strong>{formatINR(profile.youtube_dedicated_price)}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Brands worked with */}
      {(profile.brands_worked_with ?? []).length > 0 && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={17} /></div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Brands Worked With</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.brands_worked_with.map(b => (
              <span key={b} style={{ fontSize: 12.5, fontWeight: 600, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {(profile.portfolio_links ?? []).length > 0 && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(29,78,216,0.08)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={17} /></div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Portfolio / Past Work</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile.portfolio_links.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1d4ed8', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: 'rgba(29,78,216,0.05)', fontWeight: 500 }}>
                <ExternalLink size={13} /> {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={17} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Brand Reviews</div>
              {avgRating !== null && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {avgRating.toFixed(1)} / 5 · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.04)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} fill={s <= r.rating ? '#f59e0b' : 'none'} style={{ color: s <= r.rating ? '#f59e0b' : '#d1d5db' }} />
                  ))}
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {r.comment && (
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, fontStyle: 'italic' }}>"{r.comment}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
