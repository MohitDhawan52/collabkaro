'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Search, Send, Briefcase, Wallet, User, ShieldCheck, LogOut, Menu, X, BadgeCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import NotificationBell from '@/app/components/NotificationBell'
import { useIsMobile } from '@/lib/useIsMobile'
import { InfluencerContext } from '@/lib/influencerContext'

const NAV_ITEMS = [
  { href: '/influencer/dashboard', label: 'Overview',       icon: LayoutDashboard, iconBg: 'rgba(255,255,255,0.25)' },
  { href: '/influencer/gigs',      label: 'Browse Gigs',    icon: Search,          iconBg: 'rgba(6,182,212,0.5)' },
  { href: '/influencer/pitches',   label: 'My Pitches',     icon: Send,            iconBg: 'rgba(168,85,247,0.5)' },
  { href: '/influencer/collabs',   label: 'Collaborations', icon: Briefcase,       iconBg: 'rgba(16,185,129,0.5)' },
  { href: '/influencer/earnings',  label: 'Earnings',       icon: Wallet,          iconBg: 'rgba(249,115,22,0.5)' },
  { href: '/influencer/kyc',          label: 'KYC / Identity',   icon: ShieldCheck,  iconBg: 'rgba(16,185,129,0.5)' },
  { href: '/influencer/verification', label: 'Verified Badge',   icon: BadgeCheck,   iconBg: 'rgba(29,78,216,0.6)' },
  { href: '/influencer/profile',      label: 'Profile',          icon: User,         iconBg: 'rgba(236,72,153,0.5)' },
]

function NavItem({ item, active, onClick }: { item: typeof NAV_ITEMS[0]; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon
  return (
    <Link href={item.href} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.48)', fontWeight: active ? 600 : 400, fontSize: 13.5, textDecoration: 'none', background: active ? 'rgba(255,85,51,0.14)' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent', borderLeft: active ? '2px solid #FF5533' : '2px solid transparent', transition: 'all 0.14s ease', fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ width: 28, height: 28, borderRadius: 7, background: active ? 'rgba(255,85,51,0.22)' : 'rgba(255,255,255,0.07)', color: active ? '#FF5533' : 'rgba(255,255,255,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} />
      </span>
      {item.label}
    </Link>
  )
}

function Sidebar({ name, pathname, onNav, onLogout }: { name: string | null; pathname: string; onNav: () => void; onLogout: () => void }) {
  const [logoutHovered, setLogoutHovered] = useState(false)
  return (
    <div style={{ width: 240, background: '#09090D', display: 'flex', flexDirection: 'column', padding: '20px 12px', height: '100%', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ padding: '4px 8px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#FF5533,#FF8A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>C</div>
        <span style={{ fontSize: 15.5, fontWeight: 800, color: '#fff', letterSpacing: -0.4, fontFamily: "'Outfit', sans-serif" }}>CollabKaro</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', marginBottom: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
          {name ? name.charAt(0).toUpperCase() : 'I'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name ?? 'Creator'}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.36)', marginTop: 1 }}>Influencer</div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => <NavItem key={item.href} item={item} active={pathname === item.href} onClick={onNav} />)}
      </nav>
      <button onClick={onLogout} onMouseEnter={() => setLogoutHovered(true)} onMouseLeave={() => setLogoutHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, color: logoutHovered ? '#fca5a5' : 'rgba(255,255,255,0.36)', fontWeight: 400, fontSize: 13.5, background: logoutHovered ? 'rgba(239,68,68,0.14)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, transition: 'all 0.14s ease', fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.18)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LogOut size={14} />
        </span>
        Log out
      </button>
    </div>
  )
}

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
      if (!profile || profile.role !== 'influencer') { router.replace('/login'); return }
      if (profile.status === 'rejected') { router.replace('/influencer/pending'); return }
      if (profile.status !== 'approved') setIsPending(true)
      const { data: influencer } = await supabase.from('influencer_profiles').select('full_name').eq('user_id', user.id).single()
      setName(influencer?.full_name ?? null)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F3' }}>
      <div className="dash-spinner" />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F7F3' }}>

      {!isMobile && (
        <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
          <Sidebar name={name} pathname={pathname} onNav={() => {}} onLogout={handleLogout} />
        </aside>
      )}

      {isMobile && drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(12,20,69,0.55)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'relative', width: 260, height: '100%', zIndex: 51, flexShrink: 0 }}>
            <Sidebar name={name} pathname={pathname} onNav={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 52 }}>
            <X size={18} />
          </button>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: isMobile ? '12px 16px' : '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(248,247,243,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #E6E4DE', position: 'sticky', top: 0, zIndex: 20 }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setDrawerOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,85,51,0.08)', border: '1px solid rgba(255,85,51,0.15)', color: '#FF5533', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Menu size={18} />
              </button>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>CollabKaro</span>
            </div>
          ) : <div />}
          <NotificationBell />
        </div>
        {isPending && (
          <div style={{ margin: isMobile ? '12px 16px 0' : '16px 32px 0', padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#fef9c3,#fef3c7)', border: '1.5px solid #fcd34d', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#92400e' }}>Profile under review — Browse mode active</div>
              <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 2 }}>You can explore gigs and the platform, but pitching and collaborations are unlocked once your profile is approved.</div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '28px 32px' }}>
          <InfluencerContext.Provider value={{ isPending }}>
            {children}
          </InfluencerContext.Provider>
        </div>
      </main>
    </div>
  )
}
