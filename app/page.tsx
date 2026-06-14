'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false)

  const stats = [
    { label: 'Active Brands', value: '2,400+', color: 'stat-purple', icon: '🏢' },
    { label: 'Influencers', value: '18,000+', color: 'stat-green', icon: '⭐' },
    { label: 'Deals Closed', value: '94,000+', color: 'stat-yellow', icon: '🤝' },
    { label: 'Paid Out', value: '₹12Cr+', color: 'stat-blue', icon: '💰' },
  ]

  const features = [
    { icon: '🔍', title: 'Smart Discovery', desc: 'Find the perfect influencer match with advanced filters by niche, audience size, engagement rate, and location.' },
    { icon: '📄', title: 'Digital Agreements', desc: 'Create, sign, and store collaboration agreements in minutes. No PDFs, no lawyers needed for standard deals.' },
    { icon: '💳', title: 'Secure Payments', desc: 'Escrow-protected payments ensure brands only pay when work is delivered and approved.' },
    { icon: '📊', title: 'Live Analytics', desc: 'Track campaign performance, reach, and ROI in a single dashboard. No more spreadsheets.' },
    { icon: '🤝', title: 'Dispute Resolution', desc: 'Built-in mediation for when things go sideways. Fair outcomes for both sides.' },
    { icon: '🔔', title: 'Real-time Alerts', desc: 'Stay on top of every deal with instant notifications for messages, payments, and milestones.' },
  ]

  const steps = [
    { num: '01', title: 'Create your profile', desc: 'Set up as a brand or influencer in under 5 minutes.' },
    { num: '02', title: 'Discover & connect', desc: 'Browse matches or get inbound requests from interested parties.' },
    { num: '03', title: 'Sign & get paid', desc: 'Close the deal with a digital agreement and secure payment.' },
  ]

  const testimonials = [
    { name: 'Priya Sharma', role: 'Beauty Influencer, 280K followers', text: 'CollabSphere cut my deal-closing time from 2 weeks to 2 days. The payment protection alone is worth it.', avatar: 'PS', color: 'avatar-a' },
    { name: 'Rohan Mehta', role: 'Co-founder, Aura Skincare', text: 'Found 8 perfect influencers in a single afternoon. The analytics dashboard shows exactly what is working.', avatar: 'RM', color: 'avatar-b' },
    { name: 'Ananya Kapoor', role: 'Lifestyle Creator, 510K followers', text: 'Finally a platform that actually protects creators. Payments on time, every time.', avatar: 'AK', color: 'avatar-c' },
  ]

  return (
    <div style={{ background: darkMode ? '#0f1117' : '#f0f2f7', minHeight: '100vh', transition: 'background 0.3s' }}>
      {/* Nav */}
      <nav style={{
        background: darkMode ? '#1a1d2e' : '#ffffff',
        borderBottom: `1px solid ${darkMode ? '#2d3148' : '#e5e7eb'}`,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #9f67ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: darkMode ? '#fff' : '#1a1d23' }}>CollabSphere</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: darkMode ? '#2d3148' : '#f0f2f7', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}
          >{darkMode ? '☀️' : '🌙'}</button>
          <Link href="/auth/login" style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${darkMode ? '#3d4270' : '#e5e7eb'}`, color: darkMode ? '#c4c9ef' : '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Log in</Link>
          <Link href="/auth/register" style={{ padding: '8px 16px', borderRadius: 8, background: '#7c3aed', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 40px 60px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: darkMode ? '#2d2060' : '#ede9fe', padding: '6px 14px', borderRadius: 20, marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>🚀 NOW IN BETA — FREE TO JOIN</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: darkMode ? '#fff' : '#1a1d23', lineHeight: 1.15, marginBottom: 20 }}>
          Where Brands Meet<br />
          <span style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>The Right Creators</span>
        </h1>
        <p style={{ fontSize: 18, color: darkMode ? '#9ca3af' : '#6b7280', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
          CollabSphere connects brands with influencers through smart matching, legal agreements, and escrow payments — all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register" style={{ padding: '14px 28px', borderRadius: 10, background: '#7c3aed', color: 'white', textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>Start for free →</Link>
          <Link href="/discover" style={{ padding: '14px 28px', borderRadius: 10, background: darkMode ? '#1e2235' : '#fff', color: darkMode ? '#e5e7eb' : '#374151', textDecoration: 'none', fontSize: 16, fontWeight: 600, border: `1px solid ${darkMode ? '#3d4270' : '#e5e7eb'}` }}>Browse creators</Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 40px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} className={s.color} style={{ borderRadius: 12, padding: '24px', color: 'white' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 40px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: darkMode ? '#fff' : '#1a1d23', textAlign: 'center', marginBottom: 8 }}>Everything you need to collaborate</h2>
        <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 40 }}>From discovery to payment — handled.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: darkMode ? '#1a1d2e' : '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: darkMode ? '#fff' : '#1a1d23' }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '0 40px 60px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: darkMode ? '#fff' : '#1a1d23', textAlign: 'center', marginBottom: 8 }}>Three steps to your next campaign</h2>
        <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 40 }}>No calls with account managers. No contracts with lawyers.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {steps.map((s) => (
            <div key={s.num} style={{ textAlign: 'center', padding: '32px 24px', background: darkMode ? '#1a1d2e' : '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#7c3aed', opacity: 0.2, lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: darkMode ? '#fff' : '#1a1d23' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '0 40px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: darkMode ? '#fff' : '#1a1d23', textAlign: 'center', marginBottom: 40 }}>Creators and brands love CollabSphere</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {testimonials.map((t) => (
            <div key={t.name} style={{ background: darkMode ? '#1a1d2e' : '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 15, color: darkMode ? '#d1d5db' : '#374151', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={t.color} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: darkMode ? '#fff' : '#1a1d23' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 40px 80px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67ff)', borderRadius: 16, padding: '48px 40px', color: 'white' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to grow together?</h2>
          <p style={{ opacity: 0.85, fontSize: 16, marginBottom: 28 }}>Join thousands of brands and creators already using CollabSphere.</p>
          <Link href="/auth/register" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 10, background: 'white', color: '#7c3aed', textDecoration: 'none', fontSize: 16, fontWeight: 700 }}>Create your free account →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${darkMode ? '#2d3148' : '#e5e7eb'}`, padding: '24px 40px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        © 2025 CollabSphere · Built for Indian creators and brands
      </footer>
    </div>
  )
}