'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Briefcase, Sparkles, Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

const ROLES = [
  {
    href: '/register/brand',
    icon: Briefcase,
    tag: 'For Businesses',
    title: "I'm a Brand",
    desc: 'Post gigs, discover the right influencers, and run campaigns with full transparency.',
    color: '#6D28D9',
    iconBg: 'rgba(109, 40, 217, 0.10)',
    borderHover: 'rgba(109, 40, 217, 0.30)',
    perks: ['Post unlimited gigs', 'Access verified influencers', 'Secure escrow payments'],
  },
  {
    href: '/register/influencer',
    icon: Sparkles,
    tag: 'For Creators',
    title: "I'm an Influencer",
    desc: 'Build your creator profile, get discovered by top brands, and grow your income.',
    color: '#D97706',
    iconBg: 'rgba(217, 119, 6, 0.10)',
    borderHover: 'rgba(217, 119, 6, 0.30)',
    perks: ['Get brand collaboration offers', 'Showcase your reach & niche', 'Get paid on time, every time'],
  },
  {
    href: '/register/agency',
    icon: Building2,
    tag: 'For Agencies',
    title: "I'm an Agency",
    desc: 'Manage multiple brand clients, post bulk gigs at a discount, and run campaigns at scale.',
    color: '#7C3AED',
    iconBg: 'rgba(124, 58, 237, 0.10)',
    borderHover: 'rgba(124, 58, 237, 0.30)',
    perks: ['Manage multiple brand clients', 'Bulk gig packs — 30% off', 'Campaign reports & CSV export'],
  },
]

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '48px 20px', fontFamily: 'inherit' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 980 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FF5533,#FF8A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,85,51,0.35)' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, fontFamily: "'Outfit', sans-serif" }}>C</span>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>CollabKaro</span>
          </Link>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.03em' }}>
            Join CollabKaro
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Choose how you want to use the platform
          </p>
        </div>

        {/* Role cards — 3 columns on ≥768px, 1 col on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {ROLES.map((role, i) => {
            const Icon = role.icon
            return (
              <motion.div
                key={role.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 + i * 0.1 }}
              >
                <Link href={role.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div
                    style={{
                      background: 'var(--bg-card)', border: '1.5px solid var(--bg-border)',
                      borderRadius: 24, padding: '32px 28px', height: '100%',
                      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                      transition: 'all 0.18s ease', cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = role.borderHover
                      el.style.transform = 'translateY(-4px)'
                      el.style.boxShadow = `0 20px 52px ${role.iconBg}, 0 2px 8px rgba(0,0,0,0.05)`
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = ''
                      el.style.transform = ''
                      el.style.boxShadow = ''
                    }}
                  >
                    {/* Tag */}
                    <div style={{ marginBottom: 22 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: role.iconBg, color: role.color, border: `1px solid ${role.borderHover}`, fontFamily: "'DM Sans', sans-serif" }}>
                        {role.tag}
                      </span>
                    </div>

                    {/* Icon */}
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: role.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <Icon size={26} style={{ color: role.color }} />
                    </div>

                    {/* Title */}
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                      {role.title}
                    </h2>

                    {/* Desc */}
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 24px' }}>
                      {role.desc}
                    </p>

                    {/* Perks */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      {role.perks.map(perk => (
                        <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={15} style={{ color: role.color, flexShrink: 0 }} />
                          {perk}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: role.color }}>
                      Get started <ArrowRight size={15} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Login link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}