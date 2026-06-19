'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Briefcase } from 'lucide-react'
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

export default function BrandCollabsPage() {
  const [loading, setLoading] = useState(true)
  const [collabs, setCollabs] = useState<Collaboration[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: brand } = await supabase
        .from('brand_profiles').select('id').eq('user_id', user.id).single()
      if (!brand) { setLoading(false); return }

      const { data } = await supabase
        .from('collaborations')
        .select('*, gigs(title), influencer_profiles(full_name, instagram_handle)')
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false })

      setCollabs((data as unknown as Collaboration[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="dash-page-title">Collaborations</div>
      <div className="dash-page-subtitle">Track all your active and past collaborations.</div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="dash-skel" style={{ height: 90, borderRadius: 16 }} />
          ))
        ) : collabs.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Briefcase size={20} /></div>
              <div className="dash-empty-title">No collaborations yet</div>
              <div className="dash-empty-sub">Accept a pitch to start your first collaboration.</div>
            </div>
          </div>
        ) : (
          collabs.map((collab) => (
            <div key={collab.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div className="dash-row-icon"><CheckCircle2 size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="dash-row-title">{collab.gigs?.title ?? 'Collaboration'}</div>
                <div className="dash-row-meta">
                  with {collab.influencer_profiles?.full_name ?? 'Influencer'}
                  {collab.influencer_profiles?.instagram_handle && ` · @${collab.influencer_profiles.instagram_handle}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="dash-row-title">{formatINR(collab.agreed_amount)}</div>
                <span className={badgeClass(collab.status)} style={{ marginTop: 4 }}>{prettyStatus(collab.status)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
