'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard/influencer', active: true },
  { icon: '🔍', label: 'Find Gigs', href: '/discover' },
  { icon: '📄', label: 'My Deals', href: '/agreements/create' },
  { icon: '💳', label: 'Earnings', href: '/payments/create' },
]

export default function InfluencerDashboard() {
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
    { label: 'Active Deals', value: '3', change: '2 pending review', color: 'linear-gradient(135deg, #7c3aed, #9f67ff)', icon: '🤝' },
    { label: 'Total Earned', value: '₹1.8L', change: 'This year', color: 'linear-gradient(135deg, #059669, #10b981)', icon: '💰' },
    { label: 'Avg. Deal Value', value: '₹28K', change: '+₹4K vs last month', color: 'linear-gradient(135deg, #d97706, #f59e0b)', icon: '📈' },
    { label: 'Profile Views', value: '4,280', change: '+22% this week', color: 'linear-gradient(135deg, #db2777, #ec4899)', icon: '👁️' },
  ]

  const activeDeals = [
    { brand: 'Aura Skincare', campaign: 'Summer Glow Series', deadline: 'Jun 20', value: '₹35,000', status: 'In Progress' },
    { brand: 'TechGadgets India', campaign: 'Product Review', deadline: 'Jun 25', value: '₹22,000', status: 'Pending' },
    { brand: 'FitLife Wear', campaign: 'Workout Collection', deadline: 'Jul 5', value: '₹45,000', status: 'Negotiating' },
  ]

  const openGigs = [
    { brand: 'Myntra', category: 'Fashion', budget: '₹40,000', deadline: 'Jul 10', match: '94%' },
    { brand: 'Mamaearth', category: 'Beauty', budget: '₹28,000', deadline: 'Jun 30', match: '88%' },
    { brand: 'boAt', category: 'Tech', budget: '₹55,000', deadline: 'Jul 15', match: '76%' },
  ]

  const statusColor: Record<string, { bg: string; color: string }> = {
    'In Progress': { bg: '#d1fae5', color: '#059669' },
    'Pending': { bg: '#fef3c7', color: '#d97706' },
    'Negotiating': { bg: '#ede9fe', color: '#7c3aed' },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f7' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #9f67ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>C</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1d23' }}>CollabSphere</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Creator Portal</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 8, padding: '0 8px' }}>MAIN MENU</div>
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              background: item.active ? '#f5f3ff' : 'transparent',
              color: item.active ? '#7c3aed' : '#6b7280',
              fontWeight: item.active ? 600 : 400,
              fontSize: 14,
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-d" style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
              {user?.email?.[0]?.toUpperCase() || 'I'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] || 'Creator'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Creator Account</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1d23', marginBottom: 4 }}>Creator Dashboard</h1>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Track your deals, earnings, and new opportunities.</p>
          </div>
          <Link href="/discover" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#7c3aed', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600, boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
            🔍 Find Gigs
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
          {/* Active deals */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1d23' }}>Active Deals</h2>
              <Link href="/agreements/create" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeDeals.map((d) => (
                <div key={d.campaign} style={{ padding: '12px 14px', background: '#f9fafb', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1d23' }}>{d.campaign}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusColor[d.status]?.bg, color: statusColor[d.status]?.color }}>{d.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{d.brand} · Due {d.deadline}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open gigs */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1d23' }}>Recommended Gigs</h2>
              <Link href="/discover" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>See all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {openGigs.map((g) => (
                <div key={g.brand} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f9fafb', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1d23', marginBottom: 2 }}>{g.brand}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{g.category} · Due {g.deadline}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1d23', marginBottom: 4 }}>{g.budget}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#d1fae5', color: '#059669' }}>{g.match} match</span>
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