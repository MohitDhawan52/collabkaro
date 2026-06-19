'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function badgeClass(status: Collaboration['status']) {
  if (status === 'completed') return 'dash-badge dash-badge-completed'
  if (status === 'cancelled' || status === 'disputed') return 'dash-badge dash-badge-rejected'
  if (status === 'active') return 'dash-badge dash-badge-active'
  return 'dash-badge dash-badge-pending'
}

const STATUS_STEPS: Collaboration['status'][] = [
  'agreement_pending',
  'agreement_signed_influencer',
  'agreement_signed_brand',
  'active',
  'deliverable_submitted',
  'deliverable_approved',
  'completed',
]

export default function InfluencerCollabsPage() {
  const [loading, setLoading] = useState(true)
  const [collabs, setCollabs] = useState<Collaboration[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: influencer } = await supabase
        .from('influencer_profiles').select('id').eq('user_id', user.id).single()
      if (!influencer) { setLoading(false); return }

      const { data } = await supabase
        .from('collaborations')
        .select('*, gigs(title, deliverables, timeline), brand_profiles(brand_name, location)')
        .eq('influencer_id', influencer.id)
        .order('created_at', { ascending: false })

      setCollabs((data as unknown as Collaboration[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="dash-page-title">Collaborations</div>
      <div className="dash-page-subtitle">Track your active and past brand collaborations.</div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          [1, 2].map((i) => <div key={i} className="dash-skel" style={{ height: 160, borderRadius: 18 }} />)
        ) : collabs.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Inbox size={20} /></div>
              <div className="dash-empty-title">No collaborations yet</div>
              <div className="dash-empty-sub">Once a brand accepts your pitch, the collaboration will appear here.</div>
            </div>
          </div>
        ) : (
          collabs.map((collab) => {
            const stepIndex = STATUS_STEPS.indexOf(collab.status)
            const progress = Math.max(0, Math.round(((stepIndex + 1) / STATUS_STEPS.length) * 100))

            return (
              <div key={collab.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div className="dash-row-icon"><Briefcase size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div className="dash-row-title" style={{ fontSize: 15 }}>{collab.gigs?.title ?? 'Collaboration'}</div>
                      <span className={badgeClass(collab.status)}>{prettyStatus(collab.status)}</span>
                    </div>
                    <div className="dash-row-meta" style={{ marginTop: 3 }}>
                      {collab.brand_profiles?.brand_name ?? 'Brand'}
                      {collab.brand_profiles?.location && ` · ${collab.brand_profiles.location}`}
                    </div>

                    {/* Progress bar */}
                    {!['completed', 'cancelled', 'disputed'].includes(collab.status) && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            background: 'linear-gradient(90deg, var(--brand-primary), #A855F7)',
                            width: `${progress}%`, transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    {collab.gigs?.deliverables && (
                      <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>Deliverables:</strong> {collab.gigs.deliverables}
                      </div>
                    )}
                    {collab.gigs?.timeline && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Timeline: {collab.gigs.timeline}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                      {formatINR(collab.influencer_payout ?? collab.agreed_amount)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>your payout</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
