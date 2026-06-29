'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Clock, CheckCircle2, XCircle, IndianRupee, Star, Zap, Eye, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface VerifRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  payment_status: 'paid' | 'unpaid'
  applied_at: string
  admin_note: string | null
}

export default function VerificationPage() {
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<VerifRequest | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [applying, setApplying] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

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

  async function applyForVerification() {
    if (!userId) return
    setApplying(true)
    const supabase = createClient()

    const { error } = await supabase.from('verification_requests').insert({
      user_id: userId,
      status: 'pending',
      payment_status: 'paid',
      amount: 1999,
      applied_at: new Date().toISOString(),
    })

    if (error) {
      toast.error('Could not submit request: ' + error.message)
    } else {
      toast.success('Verification request submitted! Admin will review within 24–48 hours.')
      load()
    }
    setApplying(false)
  }

  const benefits = [
    { icon: Eye, title: '4-Hour Priority Access', desc: 'See every new gig 4 hours before unverified creators.' },
    { icon: BadgeCheck, title: 'Blue Tick Badge', desc: 'Your profile shows the Instagram-style ✓ badge everywhere.' },
    { icon: Star, title: 'Priority in Search', desc: 'Brands see your profile higher in influencer search results.' },
    { icon: Zap, title: 'Trusted Creator Status', desc: 'Brands trust verified creators more — higher pitch acceptance.' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1, 2].map(i => <div key={i} className="dash-skel" style={{ height: 120, borderRadius: 18 }} />)}
    </div>
  )

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        Verified Creator Badge
        {isVerified && (
          <span title="Verified">
            <BadgeCheckIcon size={26} />
          </span>
        )}
      </div>
      <div className="dash-page-subtitle">Get the blue tick and unlock priority access to every new brand gig.</div>

      {/* Status card */}
      {isVerified ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24, padding: '24px 28px', borderRadius: 20, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={26} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#065f46' }}>You're Verified! <BadgeCheckIcon size={18} inline /></div>
            <div style={{ fontSize: 13.5, color: '#047857', marginTop: 3 }}>Your profile shows the blue tick. You get 4-hour early access to all new gigs.</div>
          </div>
        </motion.div>
      ) : request ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24, padding: '24px 28px', borderRadius: 20, background: request.status === 'rejected' ? 'linear-gradient(135deg,#fff1f2,#ffe4e6)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: `1.5px solid ${request.status === 'rejected' ? '#fca5a5' : '#93c5fd'}`, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: request.status === 'rejected' ? '#ef4444' : request.status === 'approved' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {request.status === 'rejected' ? <XCircle size={26} color="#fff" /> : request.status === 'approved' ? <CheckCircle2 size={26} color="#fff" /> : <Clock size={26} color="#fff" />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: request.status === 'rejected' ? '#991b1b' : '#1e3a8a' }}>
              {request.status === 'pending' && 'Request Under Review'}
              {request.status === 'approved' && 'Request Approved!'}
              {request.status === 'rejected' && 'Request Rejected'}
            </div>
            <div style={{ fontSize: 13, color: request.status === 'rejected' ? '#b91c1c' : '#1d4ed8', marginTop: 3 }}>
              {request.status === 'pending' && 'Admin is reviewing your KYC. Usually takes 24–48 hours.'}
              {request.status === 'approved' && 'Your badge is active.'}
              {request.status === 'rejected' && (request.admin_note ?? 'Your application was not approved. You may re-apply.')}
            </div>
            {request.status === 'rejected' && (
              <button onClick={applyForVerification} disabled={applying} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {applying ? 'Submitting...' : 'Re-apply (₹1,999)'}
              </button>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* Benefits */}
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {benefits.map(b => {
          const Icon = b.icon
          return (
            <motion.div key={b.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={18} color="#fff" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{b.desc}</div>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      {!isVerified && !request && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24, background: 'var(--bg-card)', border: '1.5px solid #bfdbfe', borderRadius: 20, padding: '28px 32px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BadgeCheck size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>Get Verified for ₹1,999</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>One-time fee · Admin KYC review · Badge never expires</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            After payment, admin will verify your identity against your submitted KYC documents. Once approved, your blue tick badge goes live instantly.
          </div>

          <button
            onClick={applyForVerification}
            disabled={applying}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: applying ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: applying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 18px rgba(29,78,216,0.25)', fontFamily: 'inherit' }}
          >
            {applying ? 'Submitting...' : <><IndianRupee size={16} /> Pay ₹1,999 & Apply for Verification <ChevronRight size={16} /></>}
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
            Payment collected offline / via UPI. Mention your registered email when paying.
          </p>
        </motion.div>
      )}
      {!isVerified && request && request.status !== 'rejected' && (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 16 }}>
          Applied on {new Date(request.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Payment: ₹1,999
        </p>
      )}
    </div>
  )
}

function BadgeCheckIcon({ size, inline }: { size: number; inline?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: inline ? 'inline' : 'block', verticalAlign: inline ? 'middle' : undefined }}>
      <circle cx="12" cy="12" r="10" fill="#1d4ed8" />
      <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
