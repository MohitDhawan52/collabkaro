'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, PlusCircle, Briefcase, Users, Wallet, Settings, LogOut, Search, Menu, X, Megaphone, BarChart2, LineChart } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import NotificationBell from '@/app/components/NotificationBell'
import { useIsMobile } from '@/lib/useIsMobile'

const NAV_ITEMS = [
  { href: '/brand/dashboard',      label: 'Overview',           icon: LayoutDashboard },
  { href: '/brand/gigs',           label: 'My Gigs',            icon: Briefcase },
  { href: '/brand/gigs/new',       label: 'Post a Gig',         icon: PlusCircle },
  { href: '/brand/influencers',    label: 'Browse Influencers', icon: Search },
  { href: '/brand/pitches',        label: 'Pitches Received',   icon: Users },
  { href: '/brand/collabs',        label: 'Collaborations',     icon: Wallet },
  { href: '/brand/ads',            label: 'Gig Ads',            icon: Megaphone },
  { href: '/brand/ads/analytics',  label: 'Ad Analytics',       icon: LineChart },
  { href: '/brand/wallet',         label: 'Ad Payments',        icon: BarChart2 },
  { href: '/brand/profile',        label: 'Brand Profile',      icon: Settings },
]

function NavItem({ item, active, onClick }: { item: typeof NAV_ITEMS[0]; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon
  return (
    <Link href={item.href} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
        color: active ? '#FF5533' : hovered ? '#111113' : '#6B7280',
        fontWeight: active ? 700 : 500, fontSize: 13.5, textDecoration: 'none',
        background: active ? 'rgba(255,85,51,0.08)' : hovered ? '#F5F4F1' : 'transparent',
        borderLeft: active ? '2.5px solid #FF5533' : '2.5px solid transparent',
        transition: 'all 0.14s ease', fontFamily: "'DM Sans', sans-serif",
      }}>
      <span style={{
        width: 28, height: 28, borderRadius: 7,
        background: active ? 'rgba(255,85,51,0.12)' : hovered ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.04)',
        color: active ? '#FF5533' : hovered ? '#374151' : '#9CA3AF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} />
      </span>
      {item.label}
    </Link>
  )
}

function Sidebar({ brandName, pathname, onNav, onLogout }: { brandName: string | null; pathname: string; onNav: () => void; onLogout: () => void }) {
  const [logoutHovered, setLogoutHovered] = useState(false)
  return (
    <div style={{ width: 240, background: '#FFFFFF', display: 'flex', flexDirection: 'column', padding: '20px 12px', height: '100%', overflowY: 'auto', borderRight: '1px solid #EBEBEB' }}>
      {/* Logo */}
      <div style={{ padding: '4px 8px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#FF5533,#FF8A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 10px rgba(255,85,51,0.30)' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>C</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#111113', letterSpacing: -0.4, fontFamily: "'Outfit', sans-serif" }}>CollabKaro</span>
      </div>

      {/* User card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 18, background: 'rgba(255,85,51,0.05)', border: '1px solid rgba(255,85,51,0.12)', borderRadius: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#FF5533,#FF8A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
          {brandName ? brandName.charAt(0).toUpperCase() : 'B'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111113', lineHeight: 1.2, fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brandName ?? 'Brand'}</div>
          <div style={{ fontSize: 10.5, color: '#FF5533', marginTop: 1, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Brand Account</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => <NavItem key={item.href} item={item} active={pathname === item.href} onClick={onNav} />)}
      </nav>

      <button onClick={onLogout}
        onMouseEnter={() => setLogoutHovered(true)} onMouseLeave={() => setLogoutHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, color: logoutHovered ? '#DC2626' : '#9CA3AF', fontWeight: 500, fontSize: 13.5, background: logoutHovered ? 'rgba(239,68,68,0.07)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginTop: 6, borderTop: '1px solid #F3F3F3', paddingTop: 14, transition: 'all 0.14s ease', fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ width: 28, height: 28, borderRadius: 7, background: logoutHovered ? 'rgba(239,68,68,0.10)' : 'rgba(0,0,0,0.04)', color: logoutHovered ? '#DC2626' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LogOut size={14} />
        </span>
        Log out
      </button>
    </div>
  )
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [checking, setChecking] = useState(true)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
      if (!profile || profile.role !== 'brand') { router.replace('/login'); return }
      if (profile.status !== 'approved') { router.replace('/brand/pending'); return }
      const { data: brand } = await supabase.from('brand_profiles').select('company_name').eq('user_id', user.id).single()
      setBrandName((brand as unknown as { company_name?: string })?.company_name ?? null)
      setChecking(false)
    }
    checkAccess()
  }, [router])

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3' }}>
      <div className="dash-spinner" />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F6F3' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
          <Sidebar brandName={brandName} pathname={pathname} onNav={() => {}} onLogout={handleLogout} />
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'relative', width: 260, height: '100%', zIndex: 51, flexShrink: 0 }}>
            <Sidebar brandName={brandName} pathname={pathname} onNav={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.90)', border: 'none', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 52 }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: isMobile ? '12px 16px' : '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #EBEBEB', position: 'sticky', top: 0, zIndex: 20 }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setDrawerOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,85,51,0.08)', border: '1px solid rgba(255,85,51,0.18)', color: '#FF5533', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Menu size={18} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>CollabKaro</span>
            </div>
          ) : <div />}
          <NotificationBell />
        </div>
        <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '28px 32px' }}>{children}</div>
      </main>
    </div>
  )
}
