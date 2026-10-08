'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Zap, ArrowRight, CheckCircle, UserCheck, Briefcase,
  Search, FileText, IndianRupee, Star, TrendingUp,
  Shield, Users, ChevronRight,
} from 'lucide-react'

const STATS = [
  { value: '2,400+',  label: 'Creators',     color: '#FF5533' },
  { value: '850+',    label: 'Brands',        color: '#8B5CF6' },
  { value: '₹4.2Cr+', label: 'Paid Out',     color: '#10B981' },
  { value: '98%',     label: 'Success Rate',  color: '#F59E0B' },
]

const BRAND_STEPS = [
  { icon: UserCheck,    step: '01', title: 'Register Free',        desc: 'Create your brand profile in minutes. No approval wait — you\'re in instantly.',        color: '#FF5533', bg: 'rgba(255,85,51,0.08)' },
  { icon: Briefcase,    step: '02', title: 'Post a Gig',           desc: 'Describe your campaign — niche, budget, deliverables. Pay ₹250 to activate.',           color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  { icon: Search,       step: '03', title: 'Discover Creators',    desc: 'Browse matched influencers and send them direct collaboration pitches.',                  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { icon: IndianRupee,  step: '04', title: 'Collab & Pay Safe',    desc: 'Sign the agreement, deposit in escrow. Release funds only when satisfied.',              color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
]

const INFLUENCER_STEPS = [
  { icon: Star,         step: '01', title: 'Build Your Profile',   desc: 'Add social stats, niche, pricing, and past brand collaborations.',                       color: '#FF5533', bg: 'rgba(255,85,51,0.08)' },
  { icon: TrendingUp,   step: '02', title: 'Get Discovered',       desc: 'Brands find you through smart filters that match their campaign needs.',                  color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  { icon: FileText,     step: '03', title: 'Accept & Sign',        desc: 'Review the brand\'s pitch, negotiate terms, and sign the platform agreement.',            color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { icon: IndianRupee,  step: '04', title: 'Deliver & Get Paid',   desc: 'Submit deliverables. Payment releases automatically once the brand approves.',            color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
]

const NICHES = ['Fashion', 'Beauty', 'Food', 'Travel', 'Fitness', 'Tech', 'Gaming', 'Lifestyle', 'Finance', 'Education']

const TRUST_POINTS = [
  { icon: Shield,     label: 'Escrow-protected payments' },
  { icon: Users,      label: 'Verified brands & creators' },
  { icon: FileText,   label: 'Auto-generated agreements' },
  { icon: TrendingUp, label: 'Real-time analytics' },
]

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'influencer'>('brand')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const steps = activeTab === 'brand' ? BRAND_STEPS : INFLUENCER_STEPS

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>

      {/* Sticky Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(255,255,255,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled ? '1px solid #EBEBEB' : 'none',
        transition: 'all 0.28s ease',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#FF5533,#FF8A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(255,85,51,0.40)' }}>
              <Zap size={16} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: '#111113', letterSpacing: '-0.4px' }}>
              CollabKaro
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/login" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#6B7280', textDecoration: 'none', borderRadius: 8, transition: 'color 0.15s' }}>
              Log in
            </Link>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#FF5533', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 3px 14px rgba(255,85,51,0.42)', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.14s' }}>
              Register <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
        background: '#FFFFFF',
      }}>
        {/* Soft coral orbs on white */}
        <div style={{ position: 'absolute', top: '5%', left: '5%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,51,0.07) 0%, transparent 65%)', pointerEvents: 'none', animation: 'orbPulse 5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '4%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,138,0,0.06) 0%, transparent 65%)', pointerEvents: 'none', animation: 'orbPulse2 6s ease-in-out infinite' }} />

        {/* Badge */}
        <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,85,51,0.08)', border: '1px solid rgba(255,85,51,0.20)', borderRadius: 100, padding: '6px 15px', marginBottom: 30, fontSize: 12.5, fontWeight: 700, color: '#FF5533', fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF5533', display: 'inline-block', animation: 'orbPulse 1.8s ease-in-out infinite' }} />
          India&apos;s Smartest Influencer Platform
        </div>

        {/* Headline */}
        <h1 className="anim-fade-up-d1" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(40px, 5.8vw, 82px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: '#111113', maxWidth: 900, margin: '0 0 24px' }}>
          Where Brands Meet{' '}
          <span className="text-coral-gradient">the Right</span>
          {' '}Creators
        </h1>

        <p className="anim-fade-up-d2" style={{ fontSize: 17.5, color: '#6B7280', lineHeight: 1.82, maxWidth: 540, margin: '0 0 48px', fontFamily: "'DM Sans', sans-serif" }}>
          CollabKaro connects verified Indian brands with top influencers — escrow payments, smart matching, and legally-backed agreements. Zero payment risk.
        </p>

        {/* CTAs */}
        <div className="anim-fade-up-d3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 72 }}>
          <Link href="/register/brand" className="btn-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', fontSize: 15, fontWeight: 700, background: '#FF5533', color: '#fff', borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,85,51,0.40)', fontFamily: "'DM Sans', sans-serif" }}>
            I&apos;m a Brand <ArrowRight size={15} />
          </Link>
          <Link href="/register/influencer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', fontSize: 15, fontWeight: 700, background: '#FFFFFF', border: '1.5px solid #E0DED8', borderRadius: 12, color: '#111113', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontFamily: "'DM Sans', sans-serif" }}>
            I&apos;m a Creator <ArrowRight size={15} />
          </Link>
          <Link href="/register/agency" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', fontSize: 15, fontWeight: 700, background: '#7C3AED', color: '#fff', borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
            I&apos;m an Agency <ArrowRight size={15} />
          </Link>
        </div>

        {/* Stats row */}
        <div className="anim-fade-up-d4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, maxWidth: 700, width: '100%', background: '#FFFFFF', border: '1.5px solid #EBEBEB', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '22px 16px', borderRight: i < 3 ? '1px solid #EBEBEB' : 'none' }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 26, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Niche ticker */}
      <div style={{ borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB', padding: '14px 0', overflow: 'hidden', background: '#FAFAF9' }}>
        <div className="marquee-track">
          {[...NICHES, ...NICHES, ...NICHES].map((n, i) => (
            <span key={i} style={{ fontSize: 10.5, fontWeight: 800, color: '#ABABAB', whiteSpace: 'nowrap', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 28, fontFamily: "'DM Sans', sans-serif", padding: '0 28px' }}>
              {n}
              <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,85,51,0.50)', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section style={{ padding: '100px 24px', background: '#F7F6F3' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,85,51,0.08)', border: '1px solid rgba(255,85,51,0.20)', borderRadius: 100, padding: '5px 14px', marginBottom: 16, fontSize: 11.5, fontWeight: 800, color: '#FF5533', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Sans', sans-serif" }}>
              Simple Process
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111113', marginBottom: 14, margin: '0 0 14px' }}>
              How CollabKaro Works
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 460, margin: '0 auto 28px', fontFamily: "'DM Sans', sans-serif" }}>
              Four simple steps to start collaborating. Pick your role below.
            </p>

            {/* Tab toggle */}
            <div style={{ display: 'inline-flex', background: '#FFFFFF', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: 4, gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {(['brand', 'influencer'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '9px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13.5,
                  background: activeTab === tab ? '#FF5533' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#6B7280',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === tab ? '0 2px 14px rgba(255,85,51,0.38)' : 'none',
                }}>
                  {tab === 'brand' ? '🏢 For Brands' : '⭐ For Creators'}
                </button>
              ))}
            </div>
          </div>

          {/* Step cards */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 52, left: 'calc(12.5% + 20px)', right: 'calc(12.5% + 20px)',
              height: 2,
              background: 'linear-gradient(90deg, rgba(255,85,51,0.20), rgba(139,92,246,0.20), rgba(16,185,129,0.20))',
              zIndex: 0,
            }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, position: 'relative', zIndex: 1 }}>
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ position: 'relative', marginBottom: 22 }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFFFFF', border: `2px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${s.color}16, 0 2px 8px rgba(0,0,0,0.05)` }}>
                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={24} color={s.color} strokeWidth={1.75} />
                        </div>
                      </div>
                      <div style={{ position: 'absolute', top: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: s.color, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${s.color}40`, fontFamily: "'Outfit', sans-serif" }}>
                        {i + 1}
                      </div>
                    </div>

                    {i < steps.length - 1 && (
                      <div style={{ position: 'absolute', top: 32, left: `calc(${(i + 1) * 25}% - 10px)`, zIndex: 2 }}>
                        <ChevronRight size={18} color="#D1D5DB" strokeWidth={2} />
                      </div>
                    )}

                    <div style={{ background: '#FFFFFF', border: `1px solid ${s.color}20`, borderRadius: 16, padding: '20px 18px', width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 10px 28px ${s.color}18`; el.style.borderColor = `${s.color}40` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; el.style.borderColor = `${s.color}20` }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                        Step {s.step}
                      </div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: '#111113', marginBottom: 8, lineHeight: 1.3, margin: '0 0 8px' }}>
                        {s.title}
                      </h3>
                      <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {TRUST_POINTS.map((t) => {
            const Icon = t.icon
            return (
              <div key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 15px', background: '#F7F6F3', border: '1px solid #E8E7E3', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: "'DM Sans', sans-serif" }}>
                <Icon size={14} color="#FF5533" />
                {t.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pricing cards */}
      <section style={{ padding: '100px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#111113', marginBottom: 12, margin: '0 0 12px' }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 440, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
              Brands pay per gig. Creators join and earn for free.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 860, margin: '0 auto' }}>
            {/* Brand card */}
            <div className="card-3d" style={{ background: '#FFFFFF', border: '1.5px solid #EBEBEB', borderRadius: 24, padding: '40px 36px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,51,0.08) 0%, transparent 70%)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#FF7A5A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.10em', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  <Briefcase size={12} /> For Brands
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 52, color: '#111113', letterSpacing: '-2px', lineHeight: 1 }}>₹49</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 22, color: '#D1D5DB', letterSpacing: '-0.5px', textDecoration: 'line-through' }}>₹250</div>
                </div>
                <div style={{ marginBottom: 28, marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,85,51,0.10)', color: '#FF5533', border: '1px solid rgba(255,85,51,0.22)', fontFamily: "'DM Sans', sans-serif" }}>🎉 Launch Offer</span>
                  <span style={{ color: '#9CA3AF', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>per Gig posted</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {['Unlimited pitches to influencers', 'Escrow payment protection', 'Platform agreement included', 'Full collaboration management'].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} color="#10B981" />
                      <span style={{ fontSize: 14, color: '#374151', fontFamily: "'DM Sans', sans-serif" }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register/brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, padding: '12px 20px', background: '#FF5533', color: '#fff', borderRadius: 11, textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 3px 12px rgba(255,85,51,0.28)', fontFamily: "'DM Sans', sans-serif" }}>
                  Start as Brand <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Influencer card */}
            <div className="card-3d" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '40px 36px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,51,0.12) 0%, transparent 70%)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#FF5533', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.10em', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  <Star size={12} /> For Creators
                </div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 52, color: '#FFFFFF', letterSpacing: '-2px', lineHeight: 1 }}>FREE</div>
                <div style={{ color: 'rgba(255,255,255,0.36)', fontSize: 14, marginBottom: 28, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>to join — earn for every collab</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {['Free to join & build profile', 'Get discovered by top brands', 'Secure payment guarantee', 'Barter collabs 100% free'].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} color="#FF5533" />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', fontFamily: "'DM Sans', sans-serif" }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register/influencer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, padding: '12px 20px', background: '#FF5533', color: '#fff', borderRadius: 11, textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 3px 12px rgba(255,85,51,0.32)', fontFamily: "'DM Sans', sans-serif" }}>
                  Join as Creator <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ margin: '0 24px 80px', maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto', background: '#09090D', borderRadius: 28, padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,85,51,0.14) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 16px' }}>
            Ready to{' '}
            <span style={{ background: 'linear-gradient(135deg, #FF5533, #FF8A00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              CollabKaro?
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.46)', fontSize: 16, margin: '0 auto 36px', lineHeight: 1.78, maxWidth: 480, fontFamily: "'DM Sans', sans-serif" }}>
            Join thousands of brands and creators already building great things together across India.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register/brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', fontSize: 15, fontWeight: 700, background: '#FF5533', color: '#fff', borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 18px rgba(255,85,51,0.36)', fontFamily: "'DM Sans', sans-serif" }}>
              Register as Brand <ArrowRight size={15} />
            </Link>
            <Link href="/register/influencer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', fontSize: 15, fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)', fontFamily: "'DM Sans', sans-serif" }}>
              Join as Creator <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E6E4DE', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#FF5533,#FF8A00)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 15, color: '#111113' }}>CollabKaro</span>
          </div>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            © {new Date().getFullYear()} CollabKaro. All rights reserved.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @media (max-width: 700px) {
          .hiw-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .price-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .hiw-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
