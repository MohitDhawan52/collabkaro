'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard/brand', active: true },
  { icon: '🔍', label: 'Discover', href: '/discover' },
  { icon: '📁', label: 'My Gigs', href: '/gigs/create' },
  { icon: '📄', label: 'Agreements', href: '/agreements/create' },
  { icon: '💳', label: 'Payments', href: '/payments/create' },
]

export default function BrandDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUser(data.user)
    })
  }, [router])

  const stats = [
    { label: 'Active Campaigns', value: '4', change: '+2 this month', color: 'linear-gradient(135deg, #7c3aed, #9f67ff)', icon: '📢' },
    { label: 'Influencers Hired', value: '12', change: '+3 this week', color: 'linear-gradient(135deg, #059669, #10b981)', icon: '⭐' },
    { label: 'Total Spent', value: '₹2.4L', change: 'This quarter', color: 'linear-gradient(135deg, #d97706, #f59e0b)', icon: '💰' },
    { label: 'Avg. Engagement', value: '4.8%', change: '+0.6% vs last', color: 'linear-gradient(135deg, #2563eb, #3b82f6)', icon: '📈' },
  ]

  const recentCampaigns = [
    { name: 'Summer Collection', influencer: 'Priya Sharma', status: 'Active', budget: '₹45,000', reach: '2.8L' },
    { name: 'Product Launch', influencer: 'Rahul Verma', status: 'Review', budget: '₹32,000', reach: '1.2L' },
    { name: 'Brand Awareness', influencer: 'Ananya K', status: 'Completed', budget: '₹28,000', reach: '3.1L' },
  ]

  const topInfluencers = [
    { name: 'Priya Sharma', niche: 'Beauty', followers: '280K', rate: '4.9%', avatar: 'PS', color: 'avatar-a' },
    { name: 'Rahul Verma', niche: 'Tech', followers: '150K', rate: '6.2%', avatar: 'RV', color: 'avatar-b' },
    { name: 'Meera Patel', niche: 'Fitness', followers: '420K', rate: '3.8%', avatar: 'MP', color: 'avatar-c' },
  ]

  const statusColor: Record<string, { bg: string; color: string }> = {
    Active: { bg: '#d1fae5', color: '#059669' },
    Review: { bg: '#fef3c7', color: '#d97706' },
    Completed: { bg: '#dbeafe', color: '#2563eb' },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f7' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #9f67ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>C</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1d23' }}>CollabSphere</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Brand Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 8, padding: '0 8px' }}>MAIN MENU</div>
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              background: item.active ? '#f5f3ff' : 'transparent',
              color: item.active ? '#7c3aed' : '#6b7280',
              fontWeight: item.active ? 600 : 400,
              fontSize: 14,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-a" style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
              {user?.email?.[0]?.toUpperCase() || 'B'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] || 'Brand User'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Brand Account</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1d23', marginBottom: 4 }}>Brand Dashboard</h1>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Here's what's happening with your campaigns today.</p>
          </div>
          <Link href="/gigs/create" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#7c3aed', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600, boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
            + Post a Gig
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: s.color, borderRadius: 12, padding: '20px 24px', color: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Recent campaigns */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1d23' }}>Recent Campaigns</h2>
              <Link href="/gigs/create" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentCampaigns.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f9fafb', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1d23', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.influencer} · Reach: {c.reach}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1d23', marginBottom: 4 }}>{c.budget}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusColor[c.status]?.bg, color: statusColor[c.status]?.color }}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Influencers */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1d23' }}>Top Matches</h2>
              <Link href="/discover" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>Discover more →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topInfluencers.map((inf) => (
                <div key={inf.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10 }}>
                  <div className={inf.color} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{inf.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1d23' }}>{inf.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{inf.niche} · {inf.followers} followers</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{inf.rate}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>eng. rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}