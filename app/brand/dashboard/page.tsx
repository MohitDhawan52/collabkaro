'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Users,
  Wallet,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Inbox,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Gig, Pitch, Collaboration } from '@/types/index'

function formatINR(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function gigBadgeClass(status: Gig['status']) {
  switch (status) {
    case 'active': return 'dash-badge dash-badge-active'
    case 'paused': return 'dash-badge dash-badge-pending'
    case 'completed': return 'dash-badge dash-badge-completed'
    default: return 'dash-badge dash-badge-neutral'
  }
}

function collabBadgeClass(status: Collaboration['status']) {
  if (status === 'completed') return 'dash-badge dash-badge-completed'
  if (status === 'cancelled' || status === 'disputed') return 'dash-badge dash-badge-rejected'
  if (status === 'active') return 'dash-badge dash-badge-active'
  return 'dash-badge dash-badge-pending'
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function BrandDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('id, brand_name')
        .eq('user_id', user.id)
        .single()

      if (!brand) {
        setLoading(false)
        return
      }

      setBrandId(brand.id)
      setBrandName(brand.brand_name)

      const [gigsRes, pitchesRes, collabsRes, paymentsRes] = await Promise.all([
        supabase
          .from('gigs')
          .select('*')
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('pitches')
          .select('*, influencer_profiles(full_name, niche, instagram_followers), gigs(title)')
          .eq('brand_id', brand.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('collaborations')
          .select('*, gigs(title), influencer_profiles(full_name)')
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('payments')
          .select('amount')
          .eq('user_id', user.id)
          .in('type', ['gig_fee', 'collab_payment'])
          .eq('status', 'paid'),
      ])

      setGigs((gigsRes.data as unknown as Gig[]) ?? [])
      setPitches((pitchesRes.data as unknown as Pitch[]) ?? [])
      setCollabs((collabsRes.data as unknown as Collaboration[]) ?? [])
      setTotalSpent(
        (paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
      )
      setLoading(false)
    }

    load()
  }, [])

  const activeGigs = gigs.filter((g) => g.status === 'active').length
  const activeCollabs = collabs.filter(
    (c) => !['completed', 'cancelled', 'disputed'].includes(c.status)
  ).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="dash-page-title">
            Welcome back{brandName ? `, ${brandName}` : ''} 👋
          </div>
          <div className="dash-page-subtitle">
            Here's an overview of your campaigns and collaborations.
          </div>
        </div>
        <Link href="/brand/gigs/new" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 4 }}>
          <PlusCircle size={16} />
          Post a Gig
        </Link>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid" style={{ marginTop: 24 }}>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <Briefcase size={14} /> Active Gigs
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : activeGigs}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <Users size={14} /> New Pitches
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : pitches.length}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <TrendingUp size={14} /> Active Collabs
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : activeCollabs}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <Wallet size={14} /> Total Spent
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 90, height: 26 }} /> : formatINR(totalSpent)}
          </div>
        </div>
      </div>

      {/* My Gigs */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Your gigs</div>
          <Link href="/brand/gigs" className="dash-section-link">
            View all <ArrowRight size={13} style={{ display: 'inline', marginLeft: 2 }} />
          </Link>
        </div>
        <div className="dash-section-body">
          {loading ? (
            <div style={{ padding: 14 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="dash-skel" style={{ height: 56, marginBottom: 8 }} />
              ))}
            </div>
          ) : gigs.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Briefcase size={20} /></div>
              <div className="dash-empty-title">No gigs posted yet</div>
              <div className="dash-empty-sub">Post your first gig to start receiving pitches from creators.</div>
              <Link href="/brand/gigs/new" className="btn btn-primary" style={{ marginTop: 16, textDecoration: 'none', fontSize: 13 }}>
                <PlusCircle size={14} /> Post a Gig
              </Link>
            </div>
          ) : (
            gigs.map((gig) => (
              <div key={gig.id} className="dash-row">
                <div className="dash-row-icon"><Briefcase size={17} /></div>
                <div>
                  <div className="dash-row-title">{gig.title}</div>
                  <div className="dash-row-meta">{gig.collab_type} · {gig.platforms?.join(', ')}</div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title">{formatINR(gig.max_budget)}</div>
                  <span className={gigBadgeClass(gig.status)}>{prettyStatus(gig.status)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Pitches */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Pitches waiting for review</div>
          <Link href="/brand/pitches" className="dash-section-link">
            View all <ArrowRight size={13} style={{ display: 'inline', marginLeft: 2 }} />
          </Link>
        </div>
        <div className="dash-section-body">
          {loading ? (
            <div style={{ padding: 14 }}>
              {[1, 2].map((i) => (
                <div key={i} className="dash-skel" style={{ height: 56, marginBottom: 8 }} />
              ))}
            </div>
          ) : pitches.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Inbox size={20} /></div>
              <div className="dash-empty-title">No pending pitches</div>
              <div className="dash-empty-sub">When influencers apply to your gigs, they'll appear here.</div>
            </div>
          ) : (
            pitches.map((pitch) => (
              <div key={pitch.id} className="dash-row">
                <div className="dash-row-icon"><Users size={17} /></div>
                <div>
                  <div className="dash-row-title">
                    {pitch.influencer_profiles?.full_name ?? 'Influencer'}
                  </div>
                  <div className="dash-row-meta">
                    {pitch.gigs?.title} · {(pitch.influencer_profiles?.niche ?? []).slice(0, 2).join(', ')}
                  </div>
                </div>
                <div className="dash-row-right">
                  <span className="dash-badge dash-badge-pending">
                    <Clock size={11} /> Pending
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Collaborations */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Active collaborations</div>
          <Link href="/brand/collabs" className="dash-section-link">
            View all <ArrowRight size={13} style={{ display: 'inline', marginLeft: 2 }} />
          </Link>
        </div>
        <div className="dash-section-body">
          {loading ? (
            <div style={{ padding: 14 }}>
              {[1, 2].map((i) => (
                <div key={i} className="dash-skel" style={{ height: 56, marginBottom: 8 }} />
              ))}
            </div>
          ) : collabs.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><CheckCircle2 size={20} /></div>
              <div className="dash-empty-title">No collaborations yet</div>
              <div className="dash-empty-sub">Accept a pitch to kick off your first collaboration.</div>
            </div>
          ) : (
            collabs.map((collab) => (
              <div key={collab.id} className="dash-row">
                <div className="dash-row-icon"><CheckCircle2 size={17} /></div>
                <div>
                  <div className="dash-row-title">{collab.gigs?.title ?? 'Collaboration'}</div>
                  <div className="dash-row-meta">{collab.influencer_profiles?.full_name ?? 'Influencer'}</div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title">{formatINR(collab.agreed_amount)}</div>
                  <span className={collabBadgeClass(collab.status)}>{prettyStatus(collab.status)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
