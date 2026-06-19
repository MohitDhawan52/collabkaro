'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Briefcase, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

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
]

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-10">
          <span className="font-display text-3xl font-bold text-gradient tracking-tight">CollabKaro</span>
        </Link>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Join CollabKaro
          </h1>
          <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            Choose how you want to use the platform — you can always switch later
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ROLES.map((role, i) => {
            const Icon = role.icon
            return (
              <motion.div
                key={role.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              >
                <Link href={role.href} className="group block h-full">
                  <div
                    className="glass rounded-3xl p-8 h-full flex flex-col transition-all duration-250"
                    style={{
                      '--hover-border': role.borderHover,
                    } as React.CSSProperties}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = role.borderHover
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = `0 16px 48px ${role.iconBg}, 0 2px 8px rgba(0,0,0,0.06)`
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = ''
                      ;(e.currentTarget as HTMLElement).style.transform = ''
                      ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                    }}
                  >
                    {/* Tag */}
                    <div className="mb-5">
                      <span
                        className="badge text-xs font-semibold"
                        style={{
                          background: role.iconBg,
                          color: role.color,
                          border: `1px solid ${role.borderHover}`,
                        }}
                      >
                        {role.tag}
                      </span>
                    </div>

                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: role.iconBg }}
                    >
                      <Icon size={26} style={{ color: role.color }} />
                    </div>

                    {/* Text */}
                    <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {role.title}
                    </h2>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {role.desc}
                    </p>

                    {/* Perks */}
                    <ul className="space-y-2 mb-7 flex-1">
                      {role.perks.map(perk => (
                        <li key={perk} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={14} style={{ color: role.color, flexShrink: 0 }} />
                          {perk}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div
                      className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 group-hover:gap-3"
                      style={{ color: role.color }}
                    >
                      Get started
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Login link */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: 'var(--brand-primary)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}