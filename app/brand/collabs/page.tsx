'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Inbox, FileSignature, CheckCircle2, Clock, Zap, ExternalLink, ThumbsUp, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notifications'
import type { Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status: Collaboration['status'] }) {
  const map: Record<string, React.CSSProperties> = {
    active: { background: 'rgba(16,185,129,0.15)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)' },
    completed: { background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', border: '1px solid rgba(29,78,216,0.2)' },
    cancelled: { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' },
    disputed: { background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' },
  }
  const s = map[status] ?? { background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.25)' }
  return (
    <span style={{ ...s, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {status === 'active' && <Zap size={10} />}
      {prettyStatus(status)}
    </span>
  )
}

export default function BrandCollabsPage() {
  const [loading, setLoading] = useState(true)
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_profiles').select('id').eq('user_id', user.id).single()
    if (!brand) { setLoading(false); return }

    const { data } = await supabase
      .from('collaborations')
      .select('*, gigs(title, deliverables, timeline), influencer_profiles(full_name, instagram_handle, user_id)')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })

    setCollabs((data as unknown as Collaboration[]) ?? [])
    setLoading(false)
  }

  async function signAgreement(collab: Collaboration) {
    setActing(collab.id)
    const supabase = createClient()
    const { error } = await supabase.from('collaborations').update({
      status: 'agreement_signed_brand',
      brand_signed_at: new Date().toISOString(),
    }).eq('id', collab.id).eq('status', 'agreement_signed_influencer')

    if (error) {
      toast.error('Could not sign agreement')
    } else {
      toast.success('Agreement signed! Complete payment to go live.')
      setCollabs(prev => prev.map(c => c.id === collab.id ? { ...c, status: 'agreement_signed_brand' } : c))
    }
    setActing(null)
  }

  async function simulatePayment(collab: Collaboration) {
    // Razorpay will replace this. For now marks as paid and activates.
    setActing(collab.id)
    const supabase = createClient()
    const { error } = await supabase.from('collaborations').update({
      status: 'active',
      brand_payment_status: 'paid',
    }).eq('id', collab.id)

    if (error) {
      toast.error('Payment failed. Please try again.')
    } else {
      toast.success('Payment successful! Gig is now live.')
      setCollabs(prev => prev.map(c => c.id === collab.id ? { ...c, status: 'active', brand_payment_status: 'paid' } : c))

      // Notify the influencer
      const infUserId = (collab.influencer_profiles as unknown as { user_id?: string })?.user_id
      if (infUserId) {
        await notify({
          userId: infUserId,
          title: 'Gig is Live! 🚀',
          message: `The brand has confirmed payment for "${collab.gigs?.title ?? 'your collaboration'}". Your gig is now active — go to Collaborations and start working on your deliverables!`,
          type: 'success',
        })
      }
    }
    setActing(null)
  }

  async function approveDeliverable(collab: Collaboration) {
    if (!confirm('Approve this deliverable? This will release payment to the influencer.')) return
    setActing(collab.id)
    const supabase = createClient()
    const { error } = await supabase.from('collaborations').update({
      status: 'completed',
      deliverable_approved_at: new Date().toISOString(),
      influencer_payment_status: 'released',
    }).eq('id', collab.id).eq('status', 'deliverable_submitted')

    if (error) {
      toast.error('Could not approve deliverable')
    } else {
      toast.success('Deliverable approved! Payment released to influencer.')
      setCollabs(prev => prev.map(c => c.id === collab.id ? { ...c, status: 'completed', influencer_payment_status: 'released' } : c))

      // Notify the influencer
      const infUserId = (collab.influencer_profiles as unknown as { user_id?: string })?.user_id
      if (infUserId) {
        await notify({
          userId: infUserId,
          title: 'Deliverable Approved! ✅',
          message: `The brand approved your deliverable for "${collab.gigs?.title ?? 'your collaboration'}". Payment will be released. Great work!`,
          type: 'success',
        })
      }
    }
    setActing(null)
  }

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -0.4 }}>Collaborations</div>
      <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4, marginBottom: 24 }}>Manage your active and past collaborations.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} style={{ height: 100, borderRadius: 18, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)' }} />)
        ) : collabs.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 20, padding: '48px 24px', textAlign: 'center', backdropFilter: 'blur(14px)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(29,78,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#1d4ed8' }}><Briefcase size={22} /></div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0c1445' }}>No collaborations yet</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 5 }}>Accept a pitch to start your first collaboration.</div>
          </div>
        ) : (
          collabs.map((collab) => {
            const isActive = collab.status === 'active'
            const hasDeliverable = collab.status === 'deliverable_submitted'
            const needsPayment = collab.status === 'agreement_signed_brand'

            return (
              <div key={collab.id} style={{
                background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))'
                  : needsPayment ? 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,179,8,0.05))'
                  : hasDeliverable ? 'linear-gradient(135deg, rgba(168,85,247,0.07), rgba(236,72,153,0.04))'
                  : 'rgba(255,255,255,0.6)',
                border: isActive ? '2px solid rgba(16,185,129,0.35)'
                  : needsPayment ? '2px solid rgba(249,115,22,0.35)'
                  : hasDeliverable ? '2px solid rgba(168,85,247,0.3)'
                  : '1px solid rgba(255,255,255,0.75)',
                borderRadius: 20, padding: '20px 24px', backdropFilter: 'blur(14px)',
                boxShadow: isActive ? '0 4px 20px rgba(16,185,129,0.12)' : '0 2px 16px rgba(29,78,216,0.08)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(29,78,216,0.08)', color: isActive ? '#059669' : '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isActive ? <Zap size={18} /> : <Briefcase size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        with{' '}
                        <Link href={`/brand/influencers/${collab.influencer_id}`} style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                          {collab.influencer_profiles?.full_name ?? 'Influencer'} ↗
                        </Link>
                        {collab.influencer_profiles?.instagram_handle && `· @${collab.influencer_profiles.instagram_handle}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: '#0c1445' }}>{formatINR(collab.agreed_amount)}</div>
                    <div style={{ marginTop: 6 }}><StatusBadge status={collab.status} /></div>
                  </div>
                </div>

                {collab.gigs?.deliverables && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(29,78,216,0.05)', borderRadius: 10, fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                    <strong>Deliverables:</strong> {collab.gigs.deliverables}
                    {collab.gigs.timeline && <span style={{ color: '#6b7280' }}> · Timeline: {collab.gigs.timeline}</span>}
                  </div>
                )}

                {/* ACTION AREA */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>

                  {collab.status === 'agreement_pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                      <Clock size={14} style={{ color: '#ea580c' }} /> Waiting for influencer to sign the agreement.
                    </div>
                  )}

                  {collab.status === 'agreement_signed_influencer' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ea580c' }}>
                        <FileSignature size={14} /> Influencer signed. Your signature is required next.
                      </div>
                      <button onClick={() => signAgreement(collab)} disabled={acting === collab.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                        <FileSignature size={14} /> Sign Agreement
                      </button>
                    </div>
                  )}

                  {/* Payment gate */}
                  {collab.status === 'agreement_signed_brand' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#ea580c' }}>
                          <IndianRupee size={14} /> Both parties signed! Complete payment to activate the gig.
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          Amount: {formatINR(collab.agreed_amount)} · Platform fee (10%) included. Razorpay integration coming soon.
                        </div>
                      </div>
                      <button onClick={() => simulatePayment(collab)} disabled={acting === collab.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f97316,#eab308)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.35)', whiteSpace: 'nowrap' }}>
                        <IndianRupee size={14} /> Pay & Go Live
                      </button>
                    </div>
                  )}

                  {collab.status === 'active' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#059669' }}>
                      <Zap size={14} /> Gig is Live! Waiting for influencer to submit deliverable.
                    </div>
                  )}

                  {collab.status === 'deliverable_submitted' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <CheckCircle2 size={14} /> Deliverable submitted — review and approve.
                        </div>
                        {collab.deliverable_link && (
                          <a href={collab.deliverable_link} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12.5, color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 600 }}>
                            <ExternalLink size={12} /> View Deliverable
                          </a>
                        )}
                      </div>
                      <button onClick={() => approveDeliverable(collab)} disabled={acting === collab.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#14b8a6)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                        <ThumbsUp size={14} /> Approve & Complete
                      </button>
                    </div>
                  )}

                  {collab.status === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Collaboration completed successfully!
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
