'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Clock, CheckCircle2, XCircle, IndianRupee, Star, Zap, Eye, ChevronRight, Shield, Headphones, BarChart2, Trophy, Sparkles, FileText, AlertTriangle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface VerifRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  payment_status: 'paid' | 'unpaid'
  plan: 'starter' | 'pro'
  applied_at: string
  admin_note: string | null
}

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 499,
    gst: Math.round(499 * 0.18 * 100) / 100,
    total: Math.round(499 * 1.18 * 100) / 100,
    color: '#FF5533',
    gradient: 'linear-gradient(135deg,#FF5533,#FF8A00)',
    shadow: 'rgba(255,85,51,0.28)',
    border: 'rgba(255,85,51,0.30)',
    bg: 'rgba(255,85,51,0.05)',
    perks: [
      { icon: Eye,       text: '4-hour early access to all new gigs' },
      { icon: BadgeCheck,text: 'Verified ✓ badge on your profile' },
      { icon: Star,      text: 'Priority placement in brand search' },
      { icon: Trophy,    text: 'Highlighted card (coral border) in browse' },
      { icon: Zap,       text: 'Higher pitch acceptance — brands trust you more' },
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 1999,
    gst: Math.round(1999 * 0.18 * 100) / 100,
    total: Math.round(1999 * 1.18 * 100) / 100,
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
    shadow: 'rgba(124,58,237,0.28)',
    border: 'rgba(124,58,237,0.30)',
    bg: 'rgba(124,58,237,0.05)',
    perks: [
      { icon: Eye,        text: '4-hour early access to all new gigs' },
      { icon: BadgeCheck, text: 'Verified ✓ badge on your profile' },
      { icon: Star,       text: 'Priority placement in brand search' },
      { icon: Trophy,     text: 'Highlighted card (purple border) in browse' },
      { icon: Zap,        text: 'Higher pitch acceptance — brands trust you more' },
      { icon: IndianRupee,text: 'Payment released within 48 hours of approval' },
      { icon: Lock,       text: 'Exclusive verified-only brand campaigns' },
      { icon: Sparkles,   text: 'Featured in "Top Creators" section for brands' },
      { icon: BarChart2,  text: 'Analytics — views, pitch rate, earnings summary' },
      { icon: FileText,   text: 'Monthly performance report (PDF)' },
      { icon: AlertTriangle, text: 'Dispute priority — faster resolution' },
      { icon: Headphones, text: 'Dedicated priority support' },
    ],
  },
]

export default function VerificationPage() {
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<VerifRequest | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [applying, setApplying] = useState<'starter' | 'pro' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [infRes, reqRes] = await Promise.all([
      supabase.from('influencer_profiles').select('is_verified').eq('user_id', user.id).single(),
      supabase.from('verification_requests').select('*').eq('user_id', user.id).order('applied_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    setIsVerified(infRes.data?.is_verified ?? false)
    setRequest(reqRes.data ?? null)
    setLoading(false)
  }

  async function applyForVerification(planId: 'starter' | 'pro') {
    if (!userId) return
    setApplying(planId)
    const supabase = createClient()
    const plan = PLANS.find(p => p.id === planId)!

    const { error } = await supabase.from('verification_requests').insert({
      user_id: userId,
      status: 'pending',
      payment_status: 'paid',
      plan: planId,
      amount: plan.price,
      applied_at: new Date().toISOString(),
    })

    if (error) {
      toast.error('Could not submit request: ' + error.message)
    } else {
      toast.success('Request submitted! Admin will review within 24–48 hours.')
      load()
    }
    setApplying(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1, 2].map(i => <div key={i} className="dash-skel" style={{ height: 120, borderRadius: 18 }} />)}
    </div>
  )

  const activePlan = request ? PLANS.find(p => p.id === request.plan) ?? PLANS[1] : null

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        Verified Creator Badge
        {isVerified && <BadgeCheckIcon size={26} color={activePlan?.color ?? '#FF5533'} />}
      </div>
      <div className="dash-page-subtitle">Choose a plan, get verified, and unlock exclusive perks every month.</div>

      {/* Active status card */}
      {isVerified && activePlan && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 24, padding: '22px 26px', borderRadius: 20, background: `linear-gradient(135deg,${activePlan.bg},rgba(255,255,255,0))`, border: `1.5px solid ${activePlan.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: activePlan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={26} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#111113' }}>
              You&apos;re on the <span style={{ color: activePlan.color }}>{activePlan.name} Plan</span>! <BadgeCheckIcon size={16} color={activePlan.color} inline />
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
              ₹{activePlan.price.toLocaleString('en-IN')} + GST/month · All {activePlan.name} perks are active on your profile.
            </div>
          </div>
        </motion.div>
      )}

      {/* Pending / rejected status */}
      {!isVerified && request && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 24, padding: '22px 26px', borderRadius: 20,
            background: request.status === 'rejected' ? 'linear-gradient(135deg,#fff1f2,#ffe4e6)' : 'linear-gradient(135deg,#fffbeb,#fef3c7)',
            border: `1.5px solid ${request.status === 'rejected' ? '#fca5a5' : '#fcd34d'}`,
            display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16,
            background: request.status === 'rejected' ? '#ef4444' : '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {request.status === 'rejected' ? <XCircle size={26} color="#fff" /> : <Clock size={26} color="#fff" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: request.status === 'rejected' ? '#991b1b' : '#92400e' }}>
              {request.status === 'pending' && `${activePlan?.name ?? 'Plan'} — Under Review`}
              {request.status === 'approved' && 'Request Approved!'}
              {request.status === 'rejected' && 'Request Rejected'}
            </div>
            <div style={{ fontSize: 13, color: request.status === 'rejected' ? '#b91c1c' : '#78350f', marginTop: 3 }}>
              {request.status === 'pending' && 'Admin is reviewing your KYC. Usually takes 24–48 hours.'}
              {request.status === 'approved' && 'Your badge is now active.'}
              {request.status === 'rejected' && (request.admin_note ?? 'Your application was not approved. You may re-apply below.')}
            </div>
            {request.status === 'pending' && (
              <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 5 }}>
                Applied {new Date(request.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}₹{activePlan?.price.toLocaleString('en-IN')} + 18% GST = ₹{activePlan?.total.toLocaleString('en-IN')}/month
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Plan cards */}
      {(!request || request.status === 'rejected') && !isVerified && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Choose your plan</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {PLANS.map(plan => {
              const isSelected = selectedPlan === plan.id
              return (
                <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  style={{ borderRadius: 20, padding: '24px 22px', cursor: 'pointer', position: 'relative', transition: 'all 0.18s ease',
                    border: isSelected ? `2px solid ${plan.color}` : '1.5px solid #EBEBEB',
                    background: isSelected ? plan.bg : '#FFFFFF',
                    boxShadow: isSelected ? `0 8px 24px ${plan.shadow}` : '0 2px 8px rgba(0,0,0,0.05)' }}>

                  {plan.id === 'pro' && (
                    <div style={{ position: 'absolute', top: -10, right: 16, background: plan.gradient, color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.06em' }}>
                      MOST POPULAR
                    </div>
                  )}

                  {/* Plan header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${plan.shadow}` }}>
                      <BadgeCheck size={20} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>{plan.name}</div>
                      <div style={{ fontSize: 11, color: plan.color, fontWeight: 600 }}>Verified Creator</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>₹</span>
                      <span style={{ fontSize: 32, fontWeight: 900, color: plan.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{plan.price.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>/month</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>
                      + 18% GST = <strong style={{ color: '#6B7280' }}>₹{plan.total.toLocaleString('en-IN')}/month</strong>
                    </div>
                  </div>

                  {/* Perks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                    {plan.perks.map((perk, i) => {
                      const Icon = perk.icon
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, background: isSelected ? `${plan.color}18` : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <Icon size={11} color={isSelected ? plan.color : '#9CA3AF'} />
                          </div>
                          <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.45 }}>{perk.text}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={e => { e.stopPropagation(); applyForVerification(plan.id) }}
                    disabled={applying !== null}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                      background: applying === plan.id ? '#D1D5DB' : isSelected ? plan.gradient : '#F3F4F6',
                      color: isSelected ? '#fff' : '#6B7280',
                      fontSize: 13.5, fontWeight: 800, cursor: applying !== null ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: isSelected ? `0 4px 14px ${plan.shadow}` : 'none',
                      transition: 'all 0.14s ease', fontFamily: 'inherit' }}>
                    {applying === plan.id
                      ? 'Submitting...'
                      : <><IndianRupee size={14} /> Subscribe ₹{plan.total.toLocaleString('en-IN')}/mo <ChevronRight size={14} /></>}
                  </button>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            Payment collected via UPI / offline. Mention your registered email when paying.<br />
            Admin verifies your KYC and activates the badge within 24–48 hours.
          </p>
        </motion.div>
      )}

      {/* Shield note for verified users */}
      {isVerified && (
        <div style={{ marginTop: 28, padding: '14px 18px', borderRadius: 14, background: 'rgba(255,85,51,0.04)', border: '1px solid rgba(255,85,51,0.14)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={16} color="#FF5533" />
          <span style={{ fontSize: 13, color: '#6B7280' }}>Your badge renews monthly. Contact support to upgrade, downgrade, or cancel.</span>
        </div>
      )}
    </div>
  )
}

function BadgeCheckIcon({ size, color = '#FF5533', inline }: { size: number; color?: string; inline?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: inline ? 'inline' : 'block', verticalAlign: inline ? 'middle' : undefined }}>
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
