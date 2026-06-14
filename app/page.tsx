'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="btn btn-ghost"
      style={{ padding: '8px 12px', borderRadius: '10px' }}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

export default function Home() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', transition: 'background 0.3s' }}>

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }} className="gradient-text">CollabSphere</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ThemeToggle />
            <Link href="/auth/login" className="btn btn-ghost" style={{ fontSize: '14px' }}>Sign In</Link>
            <Link href="/auth/register" className="btn btn-primary" style={{ fontSize: '14px', borderRadius: '10px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '110px 24px 80px', textAlign: 'center' }}>
        <div className="animate-fadeInUp" style={{ marginBottom: '24px' }}>
          <span className="badge badge-purple" style={{ fontSize: '13px', padding: '6px 16px' }}>
            🇮🇳 India's #1 Influencer-Brand Platform
          </span>
        </div>

        <h1 className="animate-fadeInUp delay-1" style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '900', lineHeight: '1.08', letterSpacing: '-2px', marginBottom: '24px', color: 'var(--text-primary)' }}>
          Where <span className="gradient-text">Creators</span> Meet<br />
          <span className="gradient-text">Brands</span> That Matter
        </h1>

        <p className="animate-fadeInUp delay-2" style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 40px', lineHeight: '1.75' }}>
          Smart matchmaking, auto agreements, and secure escrow payments — everything you need to collab.
        </p>

        <div className="animate-fadeInUp delay-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '72px' }}>
          <Link href="/auth/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '15px', borderRadius: '12px' }}>
            🎭 Join as Creator
          </Link>
          <Link href="/auth/register" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '15px', borderRadius: '12px' }}>
            🏢 Join as Brand
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fadeInUp delay-4" style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: '10K+', label: 'Creators' },
            { value: '2K+', label: 'Brands' },
            { value: '₹5Cr+', label: 'Paid Out' },
            { value: '98%', label: 'Success Rate' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Everything to <span className="gradient-text">Collaborate</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Built for the Indian creator economy</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🎯', title: 'Smart Matchmaking', desc: 'AI-powered matching based on niche, followers, and engagement rate.' },
            { icon: '📄', title: 'Auto Agreements', desc: 'Legally sound agreements generated instantly with all T&Cs included.' },
            { icon: '🔒', title: 'Escrow Payments', desc: 'Brand pays first, funds held safely, released only after delivery.' },
            { icon: '📊', title: 'Verified Stats', desc: 'Instagram, YouTube & Facebook stats verified for brand confidence.' },
            { icon: '🚀', title: 'Pitch System', desc: 'Brands pitch influencers directly. Accept or decline in one click.' },
            { icon: '🛡️', title: 'Full Protection', desc: 'Both sides protected. Refund guaranteed if collaboration fails.' },
          ].map((f, i) => (
            <div key={i} className="card card-hover" style={{ padding: '32px 28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '56px', fontSize: '16px' }}>4 simple steps to your first collab</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your profile as a creator or brand in minutes' },
              { step: '02', title: 'Connect', desc: 'Brand discovers and pitches the perfect influencer' },
              { step: '03', title: 'Agree', desc: 'Both sign the auto-generated legal agreement' },
              { step: '04', title: 'Get Paid', desc: 'Deliver the content and receive secure payment' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '14px' }}>{s.step}</div>
                <h3 style={{ fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.7' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', letterSpacing: '-1px', color: 'var(--text-primary)' }}>
            Loved by <span className="gradient-text">Creators & Brands</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            { name: 'Priya S.', role: 'Fashion Influencer, Mumbai', text: 'Got my first brand deal within a week. The escrow payment gave me full confidence!', avatar: 'P' },
            { name: 'Rahul M.', role: 'Brand Manager, Delhi', text: 'Found the perfect influencer for our campaign. The agreement system saved us so much time.', avatar: 'R' },
            { name: 'Ananya K.', role: 'Beauty Creator, Bangalore', text: 'CollabSphere is a game changer. Professional, fast, and the payments are always on time.', avatar: 'A' },
          ].map((t, i) => (
            <div key={i} className="card" style={{ padding: '28px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(108,71,255,0.08), rgba(255,71,163,0.08))', borderColor: 'rgba(108,71,255,0.2)' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '14px', color: 'var(--text-primary)' }}>
            Ready to <span className="gradient-text">CollabSphere?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px', lineHeight: '1.7' }}>
            Join thousands of influencers and brands already collaborating across India.
          </p>
          <Link href="/auth/register" className="btn btn-primary" style={{ padding: '14px 40px', fontSize: '16px', borderRadius: '12px' }}>
            Join for Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>© 2025 CollabSphere. Made with ❤️ for Indian creators.</p>
      </footer>

    </div>
  )
}