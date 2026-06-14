import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)'}}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-bold gradient-text">CollabSphere</div>
        <div className="flex gap-4">
          <Link href="/auth/login" className="px-6 py-2 rounded-full text-white border border-purple-500 hover:bg-purple-500 transition-all">
            Login
          </Link>
          <Link href="/auth/register" className="px-6 py-2 rounded-full text-white gradient-bg hover:opacity-90 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <div className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6" style={{background: 'rgba(108, 71, 255, 0.15)', border: '1px solid rgba(108, 71, 255, 0.3)', color: '#8b6dff'}}>
          🚀 The #1 Influencer-Brand Marketplace in India
        </div>
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Where <span className="gradient-text">Influencers</span> Meet<br />
          <span className="gradient-text">Brands</span> That Matter
        </h1>
        <p className="text-xl mb-10 max-w-2xl" style={{color: '#9ca3af'}}>
          CollabSphere connects influencers and brands for seamless collaborations — with built-in agreements, escrow payments, and smart matchmaking.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/register?role=influencer" className="px-8 py-4 rounded-full text-white gradient-bg text-lg font-semibold hover:opacity-90 transition-all shadow-lg">
            I'm an Influencer
          </Link>
          <Link href="/auth/register?role=brand" className="px-8 py-4 rounded-full text-white text-lg font-semibold hover:opacity-90 transition-all" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)'}}>
            I'm a Brand
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">Everything You Need to <span className="gradient-text">Collaborate</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🎯', title: 'Smart Matchmaking', desc: 'Brands find the perfect influencer based on niche, followers, and engagement rate.' },
            { icon: '📄', title: 'Auto Agreements', desc: 'Platform generates legally sound agreements with all terms & conditions automatically.' },
            { icon: '💰', title: 'Escrow Payments', desc: 'Brand pays first, platform holds funds, releases to influencer only after delivery.' },
            { icon: '📊', title: 'Social Stats Verified', desc: 'Influencers add Instagram, YouTube & Facebook stats for brand confidence.' },
            { icon: '🤝', title: 'Pitch System', desc: 'Brands pitch influencers directly. Influencers accept or reject with one click.' },
            { icon: '🛡️', title: 'Full Protection', desc: 'If collab fails, payment is refunded to brand. Both sides are protected.' },
          ].map((f, i) => (
            <div key={i} className="card p-8 hover:border-purple-500 transition-all">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p style={{color: '#9ca3af'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 px-4">
        <div className="card max-w-2xl mx-auto p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to <span className="gradient-text">CollabSphere?</span></h2>
          <p className="mb-8" style={{color: '#9ca3af'}}>Join thousands of influencers and brands already collaborating.</p>
          <Link href="/auth/register" className="px-10 py-4 rounded-full text-white gradient-bg text-lg font-semibold hover:opacity-90 transition-all">
            Join for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8" style={{color: '#6b7280'}}>
        <p>© 2026 CollabSphere. All rights reserved.</p>
      </footer>
    </main>
  )
}