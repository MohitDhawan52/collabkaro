'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Zap, ArrowRight, CheckCircle, UserCheck, Briefcase,
  Search, FileText, IndianRupee, Star, TrendingUp,
  Shield, Users, ChevronRight,
} from 'lucide-react'

const STATS = [
  { value: '2,400+', label: 'Creators', color: '#6366F1' },
  { value: '850+',   label: 'Brands',   color: '#F43F5E' },
  { value: '₹4.2Cr+', label: 'Paid Out', color: '#10B981' },
  { value: '98%',    label: 'Success Rate', color: '#F59E0B' },
]

const BRAND_STEPS = [
  {
    icon: UserCheck,
    step: '01',
    title: 'Register & Verify',
    desc: 'Create your brand profile. We verify you within 24 hours.',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.08)',
  },
  {
    icon: Briefcase,
    step: '02',
    title: 'Post a Gig',
    desc: 'Describe your campaign — niche, budget, deliverables. Pay ₹250 to activate.',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    icon: Search,
    step: '03',
    title: 'Discover Creators',
    desc: 'Browse matched influencers and send them direct collaboration pitches.',
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.08)',
  },
  {
    icon: IndianRupee,
    step: '04',
    title: 'Collab & Pay Safe',
    desc: 'Sign the agreement, deposit in escrow. Release funds only when satisfied.',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
  },
]

const INFLUENCER_STEPS = [
  {
    icon: Star,
    step: '01',
    title: 'Build Your Profile',
    desc: 'Add social stats, niche, pricing, and past brand collaborations.',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.08)',
  },
  {
    icon: TrendingUp,
    step: '02',
    title: 'Get Discovered',
    desc: 'Brands find you through smart filters that match their campaign needs.',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    icon: FileText,
    step: '03',
    title: 'Accept & Sign',
    desc: 'Review the brand\'s pitch, negotiate terms, and sign the platform agreement.',
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.08)',
  },
  {
    icon: IndianRupee,
    step: '04',
    title: 'Deliver & Get Paid',
    desc: 'Submit deliverables. Payment releases automatically once the brand approves.',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
  },
]

const NICHES = ['Fashion', 'Beauty', 'Food', 'Travel', 'Fitness', 'Tech', 'Gaming', 'Lifestyle', 'Finance', 'Education']

const TRUST_POINTS = [
  { icon: Shield, label: 'Escrow-protected payments' },
  { icon: Users,  label: 'Verified brands & creators' },
  { icon: FileText, label: 'Auto-generated agreements' },
  { icon: TrendingUp, label: 'Real-time analytics' },
]

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'influencer'>('brand')
  const [scrolled, setScrolled]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const steps = activeTab === 'brand' ? BRAND_STEPS : INFLUENCER_STEPS

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* ── Sticky Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(244,244,248,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--bg-border)' : 'none',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(99,102,241,0.28)' }}>
              <Zap size={16} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              CollabKaro
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/login" style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 8, transition: 'color 0.15s ease' }}>
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ fontSize: 14, padding: '9px 18px' }}>
              Join Free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)',
          borderRadius: 100, padding: '6px 14px', marginBottom: 28,
          fontSize: 12.5, fontWeight: 600, color: 'var(--brand-primary)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)', display: 'inline-block', animation: 'pls 2s infinite' }} />
          India&apos;s Smartest Influencer Platform
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
          fontSize: 'clamp(38px, 5.5vw, 76px)',
          lineHeight: 1.08, letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          maxWidth: 860, marginBottom: 22,
        }}>
          Where Brands Meet{' '}
          <span className="text-gradient">the Right</span>
          {' '}Creators
        </h1>

        <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 560, marginBottom: 44 }}>
          CollabKaro connects verified Indian brands with top influencers — escrow payments, smart matching, and legally-backed agreements. Zero payment risk.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
          <Link href="/register/brand" className="btn btn-primary" style={{ padding: '13px 26px', fontSize: 15 }}>
            I&apos;m a Brand <ArrowRight size={15} />
          </Link>
          <Link href="/register/influencer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 26px', fontSize: 15, fontWeight: 600,
            background: 'var(--bg-card)', border: '1.5px solid var(--bg-border)',
            borderRadius: 10, color: 'var(--text-primary)', textDecoration: 'none',
            boxShadow: 'var(--shadow-card)', transition: 'all 0.15s ease',
          }}>
            I&apos;m a Creator <ArrowRight size={15} />
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, maxWidth: 680, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 18, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '20px 16px', borderRight: i < 3 ? '1px solid var(--bg-border)' : 'none' }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 26, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Niche ticker ── */}
      <div style={{ borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: '16px 0', overflow: 'hidden', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: 40, padding: '0 24px', overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>
          {[...NICHES, ...NICHES].map((n, i) => (
            <span key={i} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.09em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 14 }}>
              {n}
              {i < [...NICHES, ...NICHES].length - 1 && <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--bg-border)' }} />}
            </span>
          ))}
        </div>
      </div>

      {/* ── How It Works (GRAPHICAL) ── */}
      <section style={{ padding: '100px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)', borderRadius: 100, padding: '5px 13px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Simple Process
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 16 }}>
              How CollabKaro Works
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 28px' }}>
              Four simple steps to start collaborating. Pick your role below.
            </p>

            {/* Tab toggle */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1.5px solid var(--bg-border)', borderRadius: 12, padding: 4, gap: 4, boxShadow: 'var(--shadow-card)' }}>
              {(['brand', 'influencer'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '9px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 13.5,
                  background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === tab ? '0 2px 8px rgba(99,102,241,0.28)' : 'none',
                }}>
                  {tab === 'brand' ? '🏢 For Brands' : '⭐ For Creators'}
                </button>
              ))}
            </div>
          </div>

          {/* Step cards with connectors */}
          <div style={{ position: 'relative' }}>
            {/* Horizontal connector line (desktop) */}
            <div style={{
              position: 'absolute', top: 52, left: 'calc(12.5% + 20px)', right: 'calc(12.5% + 20px)',
              height: 2,
              background: 'linear-gradient(90deg, rgba(99,102,241,0.25), rgba(244,63,94,0.25), rgba(16,185,129,0.25))',
              zIndex: 0,
            }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, position: 'relative', zIndex: 1 }}>
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {/* Icon circle with step number */}
                    <div style={{ position: 'relative', marginBottom: 24 }}>
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: `var(--bg-card)`,
                        border: `2px solid ${s.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 8px 24px ${s.color}18, 0 2px 8px rgba(0,0,0,0.06)`,
                        position: 'relative',
                      }}>
                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={24} color={s.color} strokeWidth={1.75} />
                        </div>
                      </div>
                      {/* Step number badge */}
                      <div style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 24, height: 24, borderRadius: '50%',
                        background: s.color, color: '#fff',
                        fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${s.color}40`,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}>
                        {i + 1}
                      </div>
                    </div>

                    {/* Arrow between steps */}
                    {i < steps.length - 1 && (
                      <div style={{ position: 'absolute', top: 32, left: `calc(${(i + 1) * 25}% - 10px)`, zIndex: 2 }}>
                        <ChevronRight size={18} color="var(--text-muted)" strokeWidth={2} />
                      </div>
                    )}

                    <div style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${s.color}20`,
                      borderRadius: 16,
                      padding: '20px 18px',
                      boxShadow: 'var(--shadow-card)',
                      width: '100%',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${s.color}18`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Step {s.step}
                      </div>
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
                        {s.title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
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

      {/* ── Trust strip ── */}
      <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {TRUST_POINTS.map((t) => {
            const Icon = t.icon
            return (
              <div key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Icon size={14} color="var(--brand-primary)" />
                {t.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Pricing cards ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 12 }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto' }}>
              Brands pay per gig. Creators join and earn for free.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 860, margin: '0 auto' }}>
            {/* Brand card */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1.5px solid rgba(99,102,241,0.22)',
              borderRadius: 24,
              padding: '40px 36px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(99,102,241,0.10)',
            }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--brand-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={12} /> For Brands
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: 52, color: 'var(--text-primary)', letterSpacing: '-2px', lineHeight: 1 }}>₹250</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, marginTop: 6 }}>per Gig posted</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {['Unlimited pitches to influencers', 'Escrow payment protection', 'Platform agreement included', 'Full collaboration management'].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} color="#10B981" />
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register/brand" className="btn btn-primary" style={{ marginTop: 28, width: '100%', justifyContent: 'center', fontSize: 14 }}>
                  Start as Brand <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Influencer card */}
            <div style={{
              background: 'linear-gradient(145deg, #0D0D14 0%, #1A1025 100%)',
              border: '1px solid rgba(244,63,94,0.20)',
              borderRadius: 24,
              padding: '40px 36px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(244,63,94,0.08)',
            }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#F43F5E', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={12} /> For Creators
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: 52, color: '#FFFFFF', letterSpacing: '-2px', lineHeight: 1 }}>FREE</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28, marginTop: 6 }}>to join — earn for every collab</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {['Free to join & build profile', 'Get discovered by top brands', 'Secure payment guarantee', 'Barter collabs 100% free'].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} color="#F43F5E" />
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register/influencer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 28, width: '100%', padding: '11px 20px',
                  background: '#F43F5E', color: '#fff', borderRadius: 10, textDecoration: 'none',
                  fontSize: 14, fontWeight: 700, boxShadow: '0 3px 12px rgba(244,63,94,0.28)',
                  transition: 'all 0.15s ease',
                }}>
                  Join as Creator <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        margin: '0 24px 80px',
        maxWidth: 1100,
        marginLeft: 'auto', marginRight: 'auto',
        background: 'linear-gradient(135deg, #0D0D14 0%, #1A1025 50%, #0D0D14 100%)',
        borderRadius: 28, padding: '80px 40px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.14) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: 16 }}>
            Ready to{' '}
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #F43F5E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              CollabKaro?
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 36, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
            Join thousands of brands and creators already building great things together across India.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register/brand" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 26px', fontSize: 15, fontWeight: 700,
              background: 'var(--brand-primary)', color: '#fff', borderRadius: 10, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}>
              Register as Brand <ArrowRight size={15} />
            </Link>
            <Link href="/register/influencer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 26px', fontSize: 15, fontWeight: 700,
              background: 'rgba(255,255,255,0.10)', color: '#fff', borderRadius: 10, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.16)',
            }}>
              Join as Creator <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--bg-border)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>CollabKaro</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} CollabKaro. All rights reserved.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes pls { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 700px) {
          .hiw-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .price-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .hiw-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
