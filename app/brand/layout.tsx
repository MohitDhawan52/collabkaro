'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, PlusCircle, Briefcase, Users, Wallet, Settings, LogOut, Search, Menu, X, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import NotificationBell from '@/app/components/NotificationBell'
import { useIsMobile } from '@/lib/useIsMobile'

const NAV_ITEMS = [
  { href: '/brand/dashboard',   label: 'Overview',           icon: LayoutDashboard, iconBg: 'rgba(255,255,255,0.25)' },
  { href: '/brand/gigs',        label: 'My Gigs',            icon: Briefcase,       iconBg: 'rgba(249,115,22,0.5)' },
  { href: '/brand/gigs/new',    label: 'Post a Gig',         icon: PlusCircle,      iconBg: 'rgba(16,185,129,0.5)' },
  { href: '/brand/influencers', label: 'Browse Influencers', icon: Search,          iconBg: 'rgba(6,182,212,0.5)' },
  { href: '/brand/pitches',     label: 'Pitches Received',   icon: Users,           iconBg: 'rgba(168,85,247,0.5)' },
  { href: '/brand/collabs',     label: 'Collaborations',     icon: Wallet,          iconBg: 'rgba(236,72,153,0.5)' },
  { href: '/brand/ads',         label: 'Gig Ads',            icon: Megaphone,       iconBg: 'rgba(245,158,11,0.6)' },
  { href: '/brand/profile',     label: 'Brand Profile',      icon: Settings,        iconBg: 'rgba(6,182,212,0.5)' },
]

function NavItem({ item, active, onClick }: { item: typeof NAV_ITEMS[0]; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon
  return (
    <Link href={item.href} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, color: active ? '#fff' : hovered ? '#fff' : 'rgba(255,255,255,0.85)', fontWeight: active ? 700 : 500, fontSize: 14, textDecoration: 'none', background: active ? 'rgba(255,255,255,0.22)' : hovered ? 'rgba(255,255,255,0.12)' : 'transparent', border: active ? '1px solid rgba(255,255,255,0.32)' : '1px solid transparent', transition: 'all 0.15s ease' }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: item.iconBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>
        <Icon size={15} />
      </span>
      {item.label}
    </Link>
  )
}

function Sidebar({ brandName, pathname, onNav, onLogout }: { brandName: string | null; pathname: string; onNav: () => void; onLogout: () => void }) {
  const [logoutHovered, setLogoutHovered] = useState(false)
  return (
    <div style={{ width: 240, background: 'linear-gradient(160deg, #0c1445 0%, #1d4ed8 55%, #06b6d4 100%)', display: 'flex', flexDirection: 'column', padding: '20px 12px', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>CollabKaro</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 14, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0 }}>
          {brandName ? brandName.charAt(0).toUpperCase() : 'B'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{brandName ?? 'Brand'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Brand Account</div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV_ITEMS.map(item => <NavItem key={item.href} item={item} active={pathname === item.href} onClick={onNav} />)}
      </nav>
      <button onClick={onLogout} onMouseEnter={() => setLogoutHovered(true)} onMouseLeave={() => setLogoutHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, color: logoutHovered ? '#fca5a5' : 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: 14, background: logoutHovered ? 'rgba(239,68,68,0.18)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14, transition: 'all 0.15s ease' }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.35)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LogOut size={15} />
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
      const { data: brand } = await supabase.from('brand_profiles').select('brand_name').eq('user_id', user.id).single()
      setBrandName(brand?.brand_name ?? null)
      setChecking(false)
    }
    checkAccess()
  }, [router])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#eef2ff,#dbeafe,#ecfdf5)' }}>
      <div className="dash-spinner" />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(145deg, #eef2ff 0%, #dbeafe 50%, #ecfdf5 100%)' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
          <Sidebar brandName={brandName} pathname={pathname} onNav={() => {}} onLogout={handleLogout} />
        </aside>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(12,20,69,0.55)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'relative', width: 260, height: '100%', zIndex: 51, flexShrink: 0 }}>
            <Sidebar brandName={brandName} pathname={pathname} onNav={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 52 }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: isMobile ? '12px 16px' : '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: 0, zIndex: 20 }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setDrawerOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(29,78,216,0.1)', border: 'none', color: '#1d4ed8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Menu size={18} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0c1445' }}>CollabKaro</span>
            </div>
          ) : <div />}
          <NotificationBell />
        </div>
        <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '28px 32px' }}>{children}</div>
      </main>
    </div>
  )
}
