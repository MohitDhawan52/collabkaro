'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, AlertTriangle, CheckCircle2, XCircle, Pause, Play, X,
  IndianRupee, Eye, Send, ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface GigAd {
  id: string
  gig_id: string
  brand_user_id: string
  daily_budget: number
  total_budget: number | null
  run_continuously: boolean
  start_date: string
  end_date: string | null
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'ended'
  strike: boolean
  strike_reason: string | null
  created_at: string
  gigs?: { title: string } | null
  brand_profiles?: { company_name: string } | null
}
interface TxnSummary { ad_id: string; total: number; gst: number }
interface EventSummary { ad_id: string; impressions: number; pitches: number }

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

const statusColor: Record<string, string> = { pending: '#f59e0b', active: '#10b981', paused: '#6b7280', rejected: '#ef4444', ended: '#9ca3af' }
const statusBg: Record<string, string> = { pending: '#fef3c7', active: '#ecfdf5', paused: '#f3f4f6', rejected: '#fee2e2', ended: '#f9fafb' }

export default function AdminAdsPage() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<GigAd[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'paused' | 'rejected'>('pending')
  const [strikeModal, setStrikeModal] = useState<string | null>(null)
  const [strikeReason, setStrikeReason] = useState('')
  const [acting, setActing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Aggregated spend + events per ad
  const [spendMap, setSpendMap] = useState<Record<string, TxnSummary>>({})
  const [eventMap, setEventMap] = useState<Record<string, EventSummary>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()

    const [txnRes, eventRes] = await Promise.all([
      supabase.from('wallet_transactions').select('ad_id, total_amount, gst_amount').eq('type', 'debit').not('ad_id', 'is', null),
      supabase.from('ad_events').select('ad_id, event_type'),
    ])

    // Try with brand join; fall back to simple query if it errors
    let loadedAds: GigAd[] = []
    const { data: adsWithBrand, error: adsErr } = await supabase
      .from('gig_ads')
      .select('*, gigs(title), brand_profiles!gig_ads_brand_user_id_fkey(company_name)')
      .order('created_at', { ascending: false })
    if (!adsErr && adsWithBrand) {
      loadedAds = adsWithBrand as unknown as GigAd[]
    } else {
      const { data: adsSimple } = await supabase
        .from('gig_ads')
        .select('*, gigs(title)')
        .order('created_at', { ascending: false })
      loadedAds = (adsSimple as unknown as GigAd[]) ?? []
    }
    setAds(loadedAds)

    // Build spend map per ad
    const sm: Record<string, TxnSummary> = {}
    ;((txnRes.data ?? []) as { ad_id: string; total_amount: number; gst_amount: number }[]).forEach(t => {
      if (!sm[t.ad_id]) sm[t.ad_id] = { ad_id: t.ad_id, total: 0, gst: 0 }
      sm[t.ad_id].total += t.total_amount
      sm[t.ad_id].gst += t.gst_amount
    })
    setSpendMap(sm)

    // Build event map per ad
    const em: Record<string, EventSummary> = {}
    ;((eventRes.data ?? []) as { ad_id: string; event_type: string }[]).forEach(e => {
      if (!em[e.ad_id]) em[e.ad_id] = { ad_id: e.ad_id, impressions: 0, pitches: 0 }
      if (e.event_type === 'impression') em[e.ad_id].impressions++
      else if (e.event_type === 'pitch_click') em[e.ad_id].pitches++
    })
    setEventMap(em)

    setLoading(false)
  }

  async function approve(id: string) {
    setActing(true)
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').update({ status: 'active' }).eq('id', id)
    if (error) { toast.error(error.message); setActing(false); return }
    toast.success('Ad approved & now live')
    setActing(false); load()
  }

  async function reject(id: string) {
    setActing(true)
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').update({ status: 'rejected' }).eq('id', id)
    if (error) { toast.error(error.message); setActing(false); return }
    toast.success('Ad rejected')
    setActing(false); load()
  }

  async function issueStrike(id: string) {
    if (!strikeReason.trim()) { toast.error('Enter reason for strike'); return }
    setActing(true)
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').update({ strike: true, strike_reason: strikeReason, status: 'paused' }).eq('id', id)
    if (error) { toast.error(error.message); setActing(false); return }
    toast.success('Strike issued and ad paused')
    setStrikeModal(null); setStrikeReason(''); setActing(false); load()
  }

  async function removeStrike(id: string) {
    const supabase = createClient()
    await supabase.from('gig_ads').update({ strike: false, strike_reason: null }).eq('id', id)
    toast.success('Strike removed'); load()
  }

  async function toggleStatus(ad: GigAd) {
    const supabase = createClient()
    const next = ad.status === 'active' ? 'paused' : 'active'
    await supabase.from('gig_ads').update({ status: next }).eq('id', ad.id)
    load()
  }

  const filtered = ads.filter(a => filter === 'all' || a.status === filter)

  // Platform earnings
  const totalAdRevenue = Object.values(spendMap).reduce((s, t) => s + t.total, 0)
  const totalGSTCollected = Object.values(spendMap).reduce((s, t) => s + t.gst, 0)
  const platformNet = totalAdRevenue - totalGSTCollected

  return (
    <div>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Megaphone size={22} style={{ color: '#f59e0b' }} />
        Gig Ads Management
      </div>
      <div className="dash-page-subtitle">Review, approve, and moderate all brand gig ad campaigns.</div>

      {/* Platform Earnings */}
      <div style={{ marginTop: 20, padding: '20px 24px', borderRadius: 20, background: 'linear-gradient(135deg,#0c1445,#1d4ed8)', boxShadow: '0 6px 24px rgba(29,78,216,0.25)' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Platform Ad Revenue
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { label: 'Total Ad Spend', value: fmt(totalAdRevenue), sub: 'From all brands (incl GST)', icon: <IndianRupee size={14} /> },
            { label: 'GST Collected', value: fmt(totalGSTCollected), sub: '18% on net budget', icon: <TrendingUp size={14} /> },
            { label: 'Net Budget Spent', value: fmt(platformNet), sub: 'Excl. GST portion', icon: <IndianRupee size={14} /> },
            { label: 'Active Campaigns', value: String(ads.filter(a => a.status === 'active').length), sub: 'Currently running', icon: <Megaphone size={14} /> },
          ].map(c => (
            <div key={c.label} style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 12 }}>
                {c.icon} {c.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>{c.value}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 16 }}>
        {[
          { label: 'Pending', val: ads.filter(a => a.status === 'pending').length, color: '#f59e0b' },
          { label: 'Active', val: ads.filter(a => a.status === 'active').length, color: '#10b981' },
          { label: 'Paused', val: ads.filter(a => a.status === 'paused').length, color: '#6b7280' },
          { label: 'Strikes', val: ads.filter(a => a.strike).length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
        {(['pending', 'active', 'paused', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: filter === f ? '#f59e0b' : 'var(--bg-card)', color: filter === f ? '#fff' : 'var(--text-muted)', fontWeight: filter === f ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Ad List */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="dash-skel" style={{ height: 120, borderRadius: 18 }} />)
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon"><Megaphone size={20} /></div>
            <div className="dash-empty-title">No {filter} ads</div>
          </div>
        ) : filtered.map(ad => {
          const gig = ad.gigs as unknown as { title: string } | null
          const brand = ad.brand_profiles as unknown as { company_name: string } | null
          const spend = spendMap[ad.id]
          const events = eventMap[ad.id]
          const isExpanded = expandedId === ad.id
          const ctr = events && events.impressions > 0 ? ((events.pitches / events.impressions) * 100).toFixed(2) : '0.00'

          return (
            <motion.div key={ad.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--bg-card)', border: ad.strike ? '1.5px solid #fca5a5' : '1px solid var(--bg-border)', borderRadius: 18, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

              {/* Card body */}
              <div style={{ padding: '18px 22px' }}>
                {ad.strike && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fee2e2', borderRadius: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} /> Strike: {ad.strike_reason}
                    </span>
                    <button onClick={() => removeStrike(ad.id)} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                      Remove Strike
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{gig?.title ?? 'Gig'}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {brand?.company_name ?? 'Brand'} · ₹{ad.daily_budget}/day (excl. GST) · {ad.run_continuously ? '∞ Continuous' : `→ ${ad.end_date ? new Date(ad.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      From {new Date(ad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Submitted {new Date(ad.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: statusBg[ad.status] ?? '#f9fafb', color: statusColor[ad.status] ?? '#6b7280' }}>
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </span>

                    {ad.status === 'pending' && (
                      <>
                        <button onClick={() => approve(ad.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button onClick={() => reject(ad.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {(ad.status === 'active' || ad.status === 'paused') && (
                      <button onClick={() => toggleStatus(ad)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                        {ad.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                      </button>
                    )}
                    {ad.status !== 'rejected' && !ad.strike && (
                      <button onClick={() => { setStrikeModal(ad.id); setStrikeReason('') }} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#b91c1c', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                        <AlertTriangle size={12} /> Strike
                      </button>
                    )}
                    {/* Expand toggle */}
                    <button onClick={() => setExpandedId(isExpanded ? null : ad.id)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: isExpanded ? '#eff6ff' : '#fff', color: isExpanded ? '#1d4ed8' : '#374151', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Details
                    </button>
                  </div>
                </div>

                {/* Inline mini-metrics always visible for active/paused */}
                {(ad.status === 'active' || ad.status === 'paused') && !isExpanded && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bg-border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IndianRupee size={12} style={{ color: '#f59e0b' }} />
                      <strong style={{ color: 'var(--text-primary)' }}>{fmt(spend?.total ?? 0)}</strong> spent
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Eye size={12} style={{ color: '#1d4ed8' }} />
                      <strong style={{ color: 'var(--text-primary)' }}>{events?.impressions ?? 0}</strong> impressions
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Send size={12} style={{ color: '#8b5cf6' }} />
                      <strong style={{ color: 'var(--text-primary)' }}>{events?.pitches ?? 0}</strong> pitches
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      CTR: <strong style={{ color: 'var(--text-primary)' }}>{ctr}%</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded detail panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div key="detail"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid var(--bg-border)' }}>
                    <div style={{ padding: '18px 22px', background: '#f8faff' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Campaign Details & Money</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                        {[
                          { label: 'Total Deducted', value: fmt(spend?.total ?? 0), sub: 'From brand wallet', color: '#f59e0b', bg: '#fef3c7' },
                          { label: 'GST Collected', value: fmt(spend?.gst ?? 0), sub: '18% platform tax', color: '#ef4444', bg: '#fee2e2' },
                          { label: 'Net Ad Spend', value: fmt((spend?.total ?? 0) - (spend?.gst ?? 0)), sub: 'Excl. GST', color: '#374151', bg: '#f3f4f6' },
                          { label: 'Daily Rate (incl GST)', value: fmt(ad.daily_budget * 1.18), sub: `₹${ad.daily_budget} + 18% GST`, color: '#1d4ed8', bg: '#eff6ff' },
                        ].map(c => (
                          <div key={c.label} style={{ background: '#fff', border: `1px solid ${c.bg}`, borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: c.color }}>{c.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 14 }}>
                        {[
                          { label: 'Impressions', value: String(events?.impressions ?? 0), sub: 'Times shown to creators', color: '#1d4ed8', icon: <Eye size={13} /> },
                          { label: 'Pitch Clicks', value: String(events?.pitches ?? 0), sub: 'Pitches submitted via ad', color: '#8b5cf6', icon: <Send size={13} /> },
                          { label: 'CTR', value: `${ctr}%`, sub: 'Pitches ÷ Impressions', color: ctr >= '3.00' ? '#10b981' : '#f59e0b', icon: <TrendingUp size={13} /> },
                          { label: 'Cost/Pitch', value: (events?.pitches ?? 0) > 0 ? fmt((spend?.total ?? 0) / events!.pitches) : '—', sub: 'Total spend ÷ pitches', color: '#374151', icon: <IndianRupee size={13} /> },
                        ].map(c => (
                          <div key={c.label} style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                              <span style={{ color: c.color }}>{c.icon}</span> {c.label}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: c.color }}>{c.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #e0e7ff', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <span>Ad ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{ad.id.slice(0, 8)}…</strong></span>
                        <span>Brand User: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{ad.brand_user_id.slice(0, 8)}…</strong></span>
                        <span>Daily budget: <strong style={{ color: 'var(--text-primary)' }}>₹{ad.daily_budget}</strong> excl. GST</span>
                        <span>Schedule: <strong style={{ color: 'var(--text-primary)' }}>{new Date(ad.start_date).toLocaleDateString('en-IN')} → {ad.run_continuously ? '∞' : ad.end_date ? new Date(ad.end_date).toLocaleDateString('en-IN') : '—'}</strong></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Strike Modal */}
      {strikeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} /> Issue Strike
              </div>
              <button onClick={() => setStrikeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>This will pause the ad and show a strike warning to the brand.</p>
            <textarea
              value={strikeReason}
              onChange={e => setStrikeReason(e.target.value)}
              placeholder="Reason for strike (e.g. misleading content, policy violation)..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setStrikeModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => issueStrike(strikeModal)} disabled={acting} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                {acting ? 'Issuing...' : 'Issue Strike'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
