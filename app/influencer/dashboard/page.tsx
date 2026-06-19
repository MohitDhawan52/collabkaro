'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Send,
  Wallet,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Inbox,
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

function pitchBadgeClass(status: Pitch['status']) {
  switch (status) {
    case 'accepted': return 'dash-badge dash-badge-active'
    case 'rejected': return 'dash-badge dash-badge-rejected'
    case 'withdrawn': return 'dash-badge dash-badge-neutral'
    default: return 'dash-badge dash-badge-pending'
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

export default function InfluencerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [collabs, setCollabs] = useState<Collaboration[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: influencerProfile } = await supabase
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!influencerProfile) {
        setLoading(false)
        return
      }

      const influencerId = influencerProfile.id

      const [gigsRes, pitchesRes, collabsRes, paymentsRes] = await Promise.all([
        supabase
          .from('gigs')
          .select('*, brand_profiles(brand_name, logo_url)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('pitches')
          .select('*, gigs(title, max_budget, collab_type)')
          .eq('influencer_id', influencerId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('collaborations')
          .select('*, gigs(title), brand_profiles(brand_name)')
          .eq('influencer_id', influencerId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('payments')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'influencer_payout')
          .eq('status', 'paid'),
      ])

      setGigs((gigsRes.data as unknown as Gig[]) ?? [])
      setPitches((pitchesRes.data as unknown as Pitch[]) ?? [])
      setCollabs((collabsRes.data as unknown as Collaboration[]) ?? [])
      setTotalEarnings(
        (paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
      )
      setLoading(false)
    }

    load()
  }, [])

  const activePitchCount = pitches.filter((p) => p.status === 'pending').length
  const activeCollabCount = collabs.filter(
    (c) => !['completed', 'cancelled', 'disputed'].includes(c.status)
  ).length

  return (
    <div>
      <div className="dash-page-title">Welcome back 👋</div>
      <div className="dash-page-subtitle">
        Here's what's happening with your collaborations today.
      </div>

      {/* Stats */}
      <div className="dash-stats-grid" style={{ marginTop: 24 }}>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <Wallet size={14} /> Total Earnings
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 90, height: 26 }} /> : formatINR(totalEarnings)}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <Send size={14} /> Pending Pitches
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : activePitchCount}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <Briefcase size={14} /> Active Collabs
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : activeCollabCount}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <TrendingUp size={14} /> Open Gigs
          </div>
          <div className="dash-stat-value">
            {loading ? <span className="dash-skel" style={{ display: 'inline-block', width: 40, height: 26 }} /> : gigs.length}
          </div>
        </div>
      </div>

      {/* Browse Gigs */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Gigs for you</div>
          <Link href="/influencer/gigs" className="dash-section-link">
            Browse all <ArrowRight size={13} style={{ display: 'inline', marginLeft: 2 }} />
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
              <div className="dash-empty-icon"><Inbox size={20} /></div>
              <div className="dash-empty-title">No active gigs right now</div>
              <div className="dash-empty-sub">Check back soon — new brand campaigns are added regularly.</div>
            </div>
          ) : (
            gigs.map((gig) => (
              <Link key={gig.id} href={`/influencer/gigs/${gig.id}`} className="dash-row" style={{ textDecoration: 'none' }}>
                <div className="dash-row-icon"><Sparkles size={17} /></div>
                <div>
                  <div className="dash-row-title">{gig.title}</div>
                  <div className="dash-row-meta">
                    {gig.brand_profiles?.brand_name ?? 'Brand'} · {gig.collab_type}
                  </div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title">{formatINR(gig.max_budget)}</div>
                  <div className="dash-row-meta">budget</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* My Pitches */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Your recent pitches</div>
          <Link href="/influencer/pitches" className="dash-section-link">
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
              <div className="dash-empty-icon"><Send size={20} /></div>
              <div className="dash-empty-title">No pitches sent yet</div>
              <div className="dash-empty-sub">Browse gigs and send your first pitch to a brand.</div>
            </div>
          ) : (
            pitches.map((pitch) => (
              <div key={pitch.id} className="dash-row">
                <div className="dash-row-icon"><Send size={17} /></div>
                <div>
                  <div className="dash-row-title">{pitch.gigs?.title ?? 'Gig'}</div>
                  <div className="dash-row-meta">{formatINR(pitch.gigs?.max_budget)}</div>
                </div>
                <div className="dash-row-right">
                  <span className={pitchBadgeClass(pitch.status)}>{prettyStatus(pitch.status)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Collabs */}
      <div className="dash-section">
        <div className="dash-section-header">
          <div className="dash-section-title">Active collaborations</div>
          <Link href="/influencer/collabs" className="dash-section-link">
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
              <div className="dash-empty-icon"><Briefcase size={20} /></div>
              <div className="dash-empty-title">No collaborations yet</div>
              <div className="dash-empty-sub">Once a brand accepts your pitch, it'll show up here.</div>
            </div>
          ) : (
            collabs.map((collab) => (
              <div key={collab.id} className="dash-row">
                <div className="dash-row-icon"><Briefcase size={17} /></div>
                <div>
                  <div className="dash-row-title">{collab.gigs?.title ?? 'Collaboration'}</div>
                  <div className="dash-row-meta">{collab.brand_profiles?.brand_name ?? 'Brand'}</div>
                </div>
                <div className="dash-row-right">
                  <div className="dash-row-title">{formatINR(collab.influencer_payout ?? collab.agreed_amount)}</div>
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