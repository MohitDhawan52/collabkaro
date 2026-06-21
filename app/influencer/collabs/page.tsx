'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Inbox, FileSignature, Upload, CheckCircle2, Clock, Zap } from 'lucide-react'
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

const STATUS_STEPS: Collaboration['status'][] = [
  'agreement_pending', 'agreement_signed_influencer', 'agreement_signed_brand',
  'active', 'deliverable_submitted', 'deliverable_approved', 'completed',
]

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

export default function InfluencerCollabsPage() {
  const [loading, setLoading] = useState(true)
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [acting, setActing] = useState<string | null>(null)
  const [deliverableLink, setDeliverableLink] = useState<Record<string, string>>({})
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyUserId(user.id)

    const { data: influencer } = await supabase
      .from('influencer_profiles').select('id').eq('user_id', user.id).single()
    if (!influencer) { setLoading(false); return }

    const { data } = await supabase
      .from('collaborations')
      .select('*, gigs(title, deliverables, timeline), brand_profiles(brand_name, location, user_id)')
      .eq('influencer_id', influencer.id)
      .order('created_at', { ascending: false })

    setCollabs((data as unknown as Collaboration[]) ?? [])
    setLoading(false)
  }

  async function signAgreement(collab: Collaboration) {
    setActing(collab.id)
    const supabase = createClient()
    const { error } = await supabase.from('collaborations').update({
      status: 'agreement_signed_influencer',
      influencer_signed_at: new Date().toISOString(),
    }).eq('id', collab.id).eq('status', 'agreement_pending')

    if (error) {
      toast.error('Could not sign agreement')
    } else {
      toast.success('Agreement signed! Waiting for brand to sign and pay.')
      setCollabs(prev => prev.map(c => c.id === collab.id ? { ...c, status: 'agreement_signed_influencer' } : c))

      // Notify the brand
      const brandUserId = (collab.brand_profiles as unknown as { user_id?: string })?.user_id
      if (brandUserId) {
        await notify({
          userId: brandUserId,
          title: 'Influencer Signed the Agreement ✍️',
          message: `The influencer has signed the agreement for "${collab.gigs?.title ?? 'your gig'}". Go to Collaborations, sign and complete payment to go live.`,
          type: 'info',
        })
      }
    }
    setActing(null)
  }

  async function submitDeliverable(collab: Collaboration) {
    const link = deliverableLink[collab.id]?.trim()
    if (!link) { toast.error('Please paste your deliverable link first'); return }
    setActing(collab.id)
    const supabase = createClient()
    const { error } = await supabase.from('collaborations').update({
      status: 'deliverable_submitted',
      deliverable_link: link,
      deliverable_submitted_at: new Date().toISOString(),
    }).eq('id', collab.id)

    if (error) {
      toast.error('Could not submit deliverable')
    } else {
      toast.success('Deliverable submitted! Waiting for brand approval.')
      setCollabs(prev => prev.map(c => c.id === collab.id ? { ...c, status: 'deliverable_submitted', deliverable_link: link } : c))

      // Notify brand
      const brandUserId = (collab.brand_profiles as unknown as { user_id?: string })?.user_id
      if (brandUserId) {
        await notify({
          userId: brandUserId,
          title: 'Deliverable Submitted 📦',
          message: `The influencer has submitted their work for "${collab.gigs?.title ?? 'your gig'}". Go to Collaborations to review and approve.`,
          type: 'info',
        })
      }
    }
    setActing(null)
  }

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0c1445', fontFamily: 'Plus Jakarta Sans,sans-serif', letterSpacing: -0.4 }}>Collaborations</div>
      <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4, marginBottom: 24 }}>Track your active and past brand collaborations.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          [1, 2].map((i) => <div key={i} style={{ height: 160, borderRadius: 18, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)' }} />)
        ) : collabs.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 20, padding: '48px 24px', textAlign: 'center', backdropFilter: 'blur(14px)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(29,78,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#1d4ed8' }}><Inbox size={22} /></div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0c1445' }}>No collaborations yet</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 5 }}>Once a brand accepts your pitch, it will appear here.</div>
          </div>
        ) : (
          collabs.map((collab) => {
            const stepIndex = STATUS_STEPS.indexOf(collab.status)
            const progress = Math.max(0, Math.round(((stepIndex + 1) / STATUS_STEPS.length) * 100))
            const isActive = collab.status === 'active'

            return (
              <div key={collab.id} style={{
                background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))' : 'rgba(255,255,255,0.6)',
                border: isActive ? '2px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.75)',
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
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {collab.brand_profiles?.brand_name ?? 'Brand'}
                        {collab.brand_profiles?.location && ` · ${collab.brand_profiles.location}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: '#0c1445' }}>{formatINR(collab.influencer_payout ?? collab.agreed_amount)}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>your payout</div>
                    <div style={{ marginTop: 6 }}><StatusBadge status={collab.status} /></div>
                  </div>
                </div>

                {/* Progress bar */}
                {!['completed', 'cancelled', 'disputed'].includes(collab.status) && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                      <span>Progress</span><span>{progress}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #1d4ed8, #10b981)', width: `${progress}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )}

                {collab.gigs?.deliverables && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(29,78,216,0.05)', borderRadius: 10, fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                    <strong>Deliverables:</strong> {collab.gigs.deliverables}
                    {collab.gigs.timeline && <span style={{ color: '#6b7280' }}> · Timeline: {collab.gigs.timeline}</span>}
                  </div>
                )}

                {/* ACTION AREA */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>

                  {collab.status === 'agreement_pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ea580c' }}>
                        <Clock size={14} /> Your signature is required to proceed.
                      </div>
                      <button onClick={() => signAgreement(collab)} disabled={acting === collab.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
                        <FileSignature size={14} /> Sign Agreement
                      </button>
                    </div>
                  )}

                  {collab.status === 'agreement_signed_influencer' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      You've signed. Waiting for brand to sign and complete payment.
                    </div>
                  )}

                  {collab.status === 'agreement_signed_brand' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ea580c' }}>
                      <Clock size={14} /> Both parties signed. Waiting for brand to complete payment.
                    </div>
                  )}

                  {collab.status === 'active' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 12 }}>
                        <Zap size={14} /> Gig is Live! Payment received. Submit your deliverable when ready.
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          placeholder="Paste your deliverable link (post URL, drive link, etc.)"
                          value={deliverableLink[collab.id] ?? ''}
                          onChange={e => setDeliverableLink(prev => ({ ...prev, [collab.id]: e.target.value }))}
                          style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, background: 'rgba(255,255,255,0.8)', outline: 'none' }}
                        />
                        <button onClick={() => submitDeliverable(collab)} disabled={acting === collab.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#14b8a6)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <Upload size={14} /> Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {collab.status === 'deliverable_submitted' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      Deliverable submitted. Waiting for brand approval.
                      {collab.deliverable_link && <a href={collab.deliverable_link} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', marginLeft: 4 }}>View →</a>}
                    </div>
                  )}

                  {collab.status === 'deliverable_approved' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Deliverable approved! Payment will be released soon.
                    </div>
                  )}

                  {collab.status === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Collaboration completed.
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
