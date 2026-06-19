'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, PlusCircle, Briefcase, Users, Wallet, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/brand/dashboard',  label: 'Overview',         icon: LayoutDashboard, iconBg: 'rgba(255,255,255,0.25)', iconColor: '#fff' },
  { href: '/brand/gigs',       label: 'My Gigs',          icon: Briefcase,       iconBg: 'rgba(249,115,22,0.5)',  iconColor: '#fff' },
  { href: '/brand/gigs/new',   label: 'Post a Gig',       icon: PlusCircle,      iconBg: 'rgba(16,185,129,0.5)', iconColor: '#fff' },
  { href: '/brand/pitches',    label: 'Pitches Received', icon: Users,           iconBg: 'rgba(168,85,247,0.5)', iconColor: '#fff' },
  { href: '/brand/collabs',    label: 'Collaborations',   icon: Wallet,          iconBg: 'rgba(236,72,153,0.5)', iconColor: '#fff' },
  { href: '/brand/profile',    label: 'Brand Profile',    icon: Settings,        iconBg: 'rgba(6,182,212,0.5)',  iconColor: '#fff' },
]

function NavItem({ item, active, onClick }: { item: typeof NAV_ITEMS[0], active: boolean, onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon
  return (
    <Link href={item.href} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 12, color: active ? '#fff' : hovered ? '#fff' : 'rgba(255,255,255,0.85)', fontWeight: active ? 700 : 500, fontSize: 13.5, textDecoration: 'none', background: active ? 'rgba(255,255,255,0.22)' : hovered ? 'rgba(255,255,255,0.12)' : 'transparent', border: active ? '1px solid rgba(255,255,255,0.32)' : '1px solid transparent', transition: 'all 0.15s ease' }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: item.iconBg, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>
        <Icon size={15} />
      </span>
      {item.label}
    </Link>
  )
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [logoutHovered, setLogoutHovered] = useState(false)

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
      <aside style={{ width: 230, flexShrink: 0, background: 'linear-gradient(160deg, #0c1445 0%, #1d4ed8 55%, #06b6d4 100%)', display: 'flex', flexDirection: 'column', padding: '20px 12px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: -0.3 }}>CollabKaro</span>
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
          {NAV_ITEMS.map(item => <NavItem key={item.href} item={item} active={pathname === item.href} onClick={() => {}} />)}
        </nav>
        <button onClick={handleLogout} onMouseEnter={() => setLogoutHovered(true)} onMouseLeave={() => setLogoutHovered(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 12, color: logoutHovered ? '#fca5a5' : 'rgba(255,255,255,0.75)', fontWeight: 500, fontSize: 13.5, background: logoutHovered ? 'rgba(239,68,68,0.18)' : 'transparent', border: 'none', cursor: 'pointer', width: '100%', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14, transition: 'all 0.15s ease' }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.35)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogOut size={15} />
          </span>
          Log out
        </button>
      </aside>
      <main style={{ flex: 1, padding: '32px 36px', minWidth: 0 }}>{children}</main>
    </div>
  )
}
