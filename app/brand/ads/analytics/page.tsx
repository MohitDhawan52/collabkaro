'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart2, Eye, MousePointer, Send, TrendingUp, TrendingDown,
  IndianRupee, ArrowLeft, Calendar, Megaphone,
} from 'lucide-react'
import Link from 'next/link'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase'

interface GigAd {
  id: string; gig_id: string; daily_budget: number
  start_date: string; end_date: string | null; run_continuously: boolean
  status: string; created_at: string
  gigs?: { title: string } | null
}
interface AdEvent {
  id: string; ad_id: string; event_type: 'impression' | 'pitch_click'; date: string; created_at: string
}
interface WalletTxn {
  type: string; total_amount: number; gst_amount: number; date: string; ad_id: string | null
}

type Range = '7d' | '14d' | '30d' | 'all'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}
function fmtShort(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}
function pct(a: number, b: number) {
  if (!b) return '0%'
  return ((a / b) * 100).toFixed(2) + '%'
}

const RANGE_DAYS: Record<Range, number | null> = { '7d': 7, '14d': 14, '30d': 30, 'all': null }

export default function AdsAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<GigAd[]>([])
  const [selectedAd, setSelectedAd] = useState<string>('all')
  const [events, setEvents] = useState<AdEvent[]>([])
  const [txns, setTxns] = useState<WalletTxn[]>([])
  const [range, setRange] = useState<Range>('14d')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [adsRes, eventsRes, txnRes] = await Promise.all([
      supabase.from('gig_ads').select('*, gigs(title)').eq('brand_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ad_events').select('*').in(
        'ad_id',
        // will be replaced after ads load — fetch all for now
        ['00000000-0000-0000-0000-000000000000']
      ),
      supabase.from('wallet_transactions').select('type,total_amount,gst_amount,date,ad_id').eq('brand_user_id', user.id).eq('type', 'debit'),
    ])

    const loadedAds = (adsRes.data as unknown as GigAd[]) ?? []
    setAds(loadedAds)
    setTxns((txnRes.data as unknown as WalletTxn[]) ?? [])

    // Now fetch events for real ad IDs
    if (loadedAds.length > 0) {
      const { data: ev } = await supabase.from('ad_events').select('*').in('ad_id', loadedAds.map(a => a.id)).order('date', { ascending: true })
      setEvents((ev as unknown as AdEvent[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Date cutoff
  const days = RANGE_DAYS[range]
  const cutoff = days ? new Date(Date.now() - days * 86400000).toISOString().split('T')[0] : null

  // Filter by ad and date
  const filteredEvents = events.filter(e => {
    const adMatch = selectedAd === 'all' || e.ad_id === selectedAd
    const dateMatch = !cutoff || e.date >= cutoff
    return adMatch && dateMatch
  })
  const filteredTxns = txns.filter(t => {
    const adMatch = selectedAd === 'all' || t.ad_id === selectedAd
    const dateMatch = !cutoff || t.date >= cutoff
    return adMatch && dateMatch
  })

  const impressions = filteredEvents.filter(e => e.event_type === 'impression').length
  const pitchClicks = filteredEvents.filter(e => e.event_type === 'pitch_click').length
  const totalSpend = filteredTxns.reduce((s, t) => s + t.total_amount, 0)
  const gstPaid = filteredTxns.reduce((s, t) => s + t.gst_amount, 0)
  const cpi = impressions > 0 ? totalSpend / impressions : 0     // cost per impression
  const cpc = pitchClicks > 0 ? totalSpend / pitchClicks : 0     // cost per pitch
  const ctr = impressions > 0 ? (pitchClicks / impressions) * 100 : 0

  // Build daily chart data
  const allDates: Set<string> = new Set()
  filteredEvents.forEach(e => allDates.add(e.date))
  filteredTxns.forEach(t => allDates.add(t.date))

  const dailyData = Array.from(allDates).sort().map(date => {
    const dayEvents = filteredEvents.filter(e => e.date === date)
    const daySpend = filteredTxns.filter(t => t.date === date).reduce((s, t) => s + t.total_amount, 0)
    return {
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      Impressions: dayEvents.filter(e => e.event_type === 'impression').length,
      Pitches: dayEvents.filter(e => e.event_type === 'pitch_click').length,
      Spend: parseFloat(daySpend.toFixed(2)),
    }
  })

  // Per-ad summary table
  const adSummaries = ads.map(ad => {
    const adEvents = filteredEvents.filter(e => e.ad_id === ad.id)
    const adTxns = filteredTxns.filter(t => t.ad_id === ad.id)
    const imp = adEvents.filter(e => e.event_type === 'impression').length
    const pit = adEvents.filter(e => e.event_type === 'pitch_click').length
    const spend = adTxns.reduce((s, t) => s + t.total_amount, 0)
    return {
      id: ad.id,
      title: (ad.gigs as unknown as { title: string } | null)?.title ?? 'Gig',
      status: ad.status,
      daily_budget: ad.daily_budget,
      impressions: imp,
      pitches: pit,
      ctr: imp > 0 ? (pit / imp) * 100 : 0,
      spend,
      cpc: pit > 0 ? spend / pit : 0,
    }
  })

  const statCard = (icon: React.ReactNode, label: string, value: string, sub: string, color: string, bg: string) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color }}>
        {icon}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11.5, color, fontWeight: 600, marginTop: 3 }}>{sub}</div>
    </div>
  )

  if (loading) return (
    <div>
      <div className="dash-page-title">Ad Analytics</div>
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[1,2,3,4].map(i => <div key={i} className="dash-skel" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <Link href="/brand/ads" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Ads
        </Link>
      </div>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BarChart2 size={22} style={{ color: '#1d4ed8' }} /> Ad Analytics
      </div>
      <div className="dash-page-subtitle">Performance metrics for your sponsored gig campaigns — Meta Ads style.</div>

      {/* Filters */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Ad selector */}
        <select value={selectedAd} onChange={e => setSelectedAd(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111827', fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 200 }}>
          <option value="all">All Campaigns</option>
          {ads.map(a => <option key={a.id} value={a.id}>{(a.gigs as unknown as { title: string } | null)?.title ?? 'Gig'}</option>)}
        </select>

        {/* Date range */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([['7d','Last 7 days'],['14d','Last 14 days'],['30d','Last 30 days'],['all','All time']] as [Range,string][]).map(([val, label]) => (
            <button key={val} onClick={() => setRange(val)}
              style={{ padding: '7px 14px', borderRadius: 9, border: range === val ? 'none' : '1px solid var(--bg-border)', background: range === val ? '#1d4ed8' : 'var(--bg-card)', color: range === val ? '#fff' : 'var(--text-muted)', fontWeight: range === val ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {statCard(<Eye size={17} />, 'Total Impressions', fmtShort(impressions), 'Times your gig was shown', '#1d4ed8', '#eff6ff')}
        {statCard(<MousePointer size={17} />, 'Pitch Clicks', fmtShort(pitchClicks), `CTR: ${ctr.toFixed(2)}%`, '#8b5cf6', '#f5f3ff')}
        {statCard(<IndianRupee size={17} />, 'Total Spend', fmt(totalSpend), `GST: ${fmt(gstPaid)}`, '#f59e0b', '#fef3c7')}
        {statCard(<Send size={17} />, 'Cost per Pitch', pitchClicks > 0 ? fmt(cpc) : '—', pitchClicks > 0 ? `${pitchClicks} total pitches` : 'No pitches yet', '#10b981', '#ecfdf5')}
      </div>

      {/* KPI row */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Click-Through Rate', value: `${ctr.toFixed(2)}%`, sub: 'Pitches ÷ Impressions', good: ctr >= 3, icon: <TrendingUp size={14} /> },
          { label: 'Cost Per Impression', value: impressions > 0 ? fmt(cpi) : '—', sub: 'Spend ÷ Impressions', good: true, icon: <IndianRupee size={14} /> },
          { label: 'Cost Per 1K Impressions', value: impressions > 0 ? fmt((totalSpend / impressions) * 1000) : '—', sub: 'CPM equivalent', good: true, icon: <BarChart2 size={14} /> },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 14, padding: '14px 18px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{k.sub}</div>
            </div>
            <div style={{ color: k.good ? '#10b981' : '#f59e0b' }}>{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18 }}>
        {/* Daily impressions + pitches */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: '22px 24px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)', marginBottom: 4 }}>Impressions & Pitches Over Time</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Daily breakdown of reach and engagement</div>
          {dailyData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Impressions" fill="#bfdbfe" radius={[4,4,0,0]} />
                <Bar dataKey="Pitches" fill="#1d4ed8" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily spend */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: '22px 24px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)', marginBottom: 4 }}>Daily Spend (₹)</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Budget deducted per day incl. GST</div>
          {dailyData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No spend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v}`, 'Spend']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Line type="monotone" dataKey="Spend" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-campaign breakdown table */}
      <div style={{ marginTop: 22, background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Megaphone size={16} style={{ color: '#f59e0b' }} />
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>Campaign Breakdown</div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 24px', background: 'var(--bg-input)', borderBottom: '1px solid var(--bg-border)' }}>
          {['Campaign', 'Status', 'Impressions', 'Pitches', 'CTR', 'Spend', 'Cost/Pitch'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {adSummaries.length === 0 ? (
          <div style={{ padding: '30px 24px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No campaigns yet</div>
        ) : adSummaries.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: i < adSummaries.length - 1 ? '1px solid var(--bg-border)' : 'none', background: selectedAd === a.id ? '#f8faff' : 'transparent', cursor: 'pointer' }}
            onClick={() => setSelectedAd(selectedAd === a.id ? 'all' : a.id)}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{a.title}</div>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: a.status === 'active' ? '#ecfdf5' : a.status === 'pending' ? '#fef3c7' : '#f3f4f6', color: a.status === 'active' ? '#10b981' : a.status === 'pending' ? '#f59e0b' : '#6b7280' }}>
                {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
              </span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtShort(a.impressions)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#8b5cf6' }}>{a.pitches}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: a.ctr >= 3 ? '#10b981' : '#f59e0b' }}>{a.ctr.toFixed(2)}%</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(a.spend)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1d4ed8' }}>{a.cpc > 0 ? fmt(a.cpc) : '—'}</div>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Eye size={12} /> Impression = gig shown on browse page</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Send size={12} /> Pitch click = creator clicked "Pitch" on your sponsored gig</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} /> Data updates within a few seconds of each event</span>
      </div>
    </div>
  )
}
