'use client'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6c47ff, #ff47a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }} className="gradient-text">CollabSphere</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <Link href="/auth/login" className="btn btn-ghost" style={{ fontSize: '14px' }}>Sign In</Link>
            <Link href="/auth/register" className="btn btn-primary" style={{ fontSize: '14px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div className="animate-fadeInUp">
          <div className="badge badge-purple" style={{ marginBottom: '24px', fontSize: '13px', padding: '6px 16px' }}>
            🇮🇳 India's #1 Influencer-Brand Platform
          </div>
        </div>
        <h1 className="animate-fadeInUp delay-1" style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-2px', marginBottom: '24px' }}>
          Where <span className="gradient-text">Creators</span> Meet<br />
          <span className="gradient-text">Brands</span> That Matter
        </h1>
        <p className="animate-fadeInUp delay-2" style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: '1.7' }}>
          CollabSphere connects influencers and brands with smart matchmaking, auto agreements, and secure escrow payments.
        </p>
        <div className="animate-fadeInUp delay-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register?role=influencer" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '12px' }}>
            🎭 I'm a Creator
          </Link>
          <Link href="/auth/register?role=brand" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '12px' }}>
            🏢 I'm a Brand
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fadeInUp delay-4" style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '64px', flexWrap: 'wrap' }}>
          {[
            { value: '10K+', label: 'Influencers' },
            { value: '2K+', label: 'Brands' },
            { value: '₹5Cr+', label: 'Paid Out' },
            { value: '98%', label: 'Success Rate' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px' }}>
            Everything to <span className="gradient-text">Collaborate</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Built for the Indian creator economy</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🎯', title: 'Smart Matchmaking', desc: 'AI-powered matching based on niche, followers, and engagement rate.' },
            { icon: '📄', title: 'Auto Agreements', desc: 'Legally sound agreements generated instantly with all T&Cs.' },
            { icon: '🔒', title: 'Escrow Payments', desc: 'Brand pays first, funds held safely, released only after delivery.' },
            { icon: '📊', title: 'Verified Stats', desc: 'Instagram, YouTube & Facebook stats verified for brand confidence.' },
            { icon: '🚀', title: 'Pitch System', desc: 'Brands pitch influencers directly. Accept or reject in one click.' },
            { icon: '🛡️', title: 'Full Protection', desc: 'Both sides protected. Refund guaranteed if collaboration fails.' },
          ].map((f, i) => (
            <div key={i} className="card card-hover animate-fadeInUp" style={{ padding: '28px', animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '56px' }}>Simple 4-step process</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your profile as influencer or brand' },
              { step: '02', title: 'Connect', desc: 'Brand discovers and pitches influencers' },
              { step: '03', title: 'Agree', desc: 'Both sign the auto-generated agreement' },
              { step: '04', title: 'Get Paid', desc: 'Deliver content and receive payment' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '12px' }}>{s.step}</div>
                <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '56px 40px', background: 'linear-gradient(135deg, rgba(108,71,255,0.08), rgba(255,71,163,0.08))', borderColor: 'rgba(108,71,255,0.2)' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px' }}>
            Ready to <span className="gradient-text">CollabSphere?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
            Join thousands of influencers and brands already collaborating.
          </p>
          <Link href="/auth/register" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '12px' }}>
            Join for Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>© 2025 CollabSphere. Made with ❤️ for Indian creators.</p>
      </footer>
    </div>
  )
}