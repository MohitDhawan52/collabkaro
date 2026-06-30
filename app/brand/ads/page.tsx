'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Plus, Pause, Play, AlertTriangle,
  X, Edit2, Trash2, Wallet, Plus as PlusIcon,
  Infinity, Calendar, ChevronRight, Info, Eye, Send, IndianRupee, BarChart2, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const GST = 0.18

interface Gig { id: string; title: string; influencer_limit: number | null; accepted_count: number }
interface GigAd {
  id: string; gig_id: string; daily_budget: number; total_budget: number | null
  start_date: string; end_date: string | null; run_continuously: boolean
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'ended'
  strike: boolean; strike_reason: string | null; created_at: string
  gigs?: { title: string } | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', background: '#f9fafb',
  color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7,
}

const statusColor: Record<string, string> = { pending: '#f59e0b', active: '#10b981', paused: '#6b7280', rejected: '#ef4444', ended: '#9ca3af' }
const statusBg: Record<string, string> = { pending: '#fef3c7', active: '#ecfdf5', paused: '#f3f4f6', rejected: '#fee2e2', ended: '#f9fafb' }

const EMPTY_FORM = { gig_id: '', daily_budget: '85', run_continuously: true, start_date: '', end_date: '' }

export default function BrandAdsPage() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<GigAd[]>([])
  const [gigs, setGigs] = useState<Gig[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [wallet, setWallet] = useState<number>(0)
  const [spendMap, setSpendMap] = useState<Record<string, { total: number; gst: number }>>({})
  const [eventMap, setEventMap] = useState<Record<string, { impressions: number; views: number; pitches: number }>>({})

  const searchParams = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editAdId, setEditAdId] = useState<string | null>(null)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [fundAmount, setFundAmount] = useState('500')
  const [form, setForm] = useState(EMPTY_FORM)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    load()
    const supabase = createClient()
    let userId: string | null = null
    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null
    })
    const channel = supabase
      .channel('brand-gig-ads-rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gig_ads' }, (payload) => {
        const updated = payload.new as GigAd & { brand_user_id?: string }
        if (userId && updated.brand_user_id && updated.brand_user_id !== userId) return
        setAds(prev => {
          const existing = prev.find(a => a.id === updated.id)
          if (!existing) return prev
          const oldStatus = existing.status
          const newStatus = updated.status
          if (oldStatus !== newStatus) {
            if (newStatus === 'active') toast.success('Your ad is now live! 🎉')
            else if (newStatus === 'rejected') toast.error('Your ad was rejected by admin')
            else if (newStatus === 'paused') toast.info('Your ad has been paused')
          }
          return prev.map(a => a.id === updated.id ? { ...a, ...updated } : a)
        })
      })
      // Real-time spend updates — patch spendMap when a new debit lands
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions' }, (payload) => {
        const t = payload.new as { brand_user_id: string; type: string; total_amount: number; gst_amount: number; ad_id: string | null }
        if (!t.ad_id || t.type !== 'debit') return
        if (userId && t.brand_user_id !== userId) return
        setSpendMap(prev => {
          const cur = prev[t.ad_id!] ?? { ad_id: t.ad_id!, total: 0, gst: 0 }
          return { ...prev, [t.ad_id!]: { ...cur, total: cur.total + t.total_amount, gst: cur.gst + t.gst_amount } }
        })
      })
      // Real-time event updates — patch eventMap on new impression/pitch
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ad_events' }, (payload) => {
        const e = payload.new as { ad_id: string; event_type: 'impression' | 'view' | 'pitch_click' }
        if (!e.ad_id) return
        setEventMap(prev => {
          const cur = prev[e.ad_id] ?? { impressions: 0, views: 0, pitches: 0 }
          return {
            ...prev,
            [e.ad_id]: {
              impressions: cur.impressions + (e.event_type === 'impression' ? 1 : 0),
              views: cur.views + (e.event_type === 'view' ? 1 : 0),
              pitches: cur.pitches + (e.event_type === 'pitch_click' ? 1 : 0),
            },
          }
        })
      })
      .subscribe()
    // 15s polling fallback — ensures analytics strip updates even if realtime not configured
    const poll = setInterval(() => { load() }, 15000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [])

  // Auto-open create modal if coming from "Boost this Gig"
  useEffect(() => {
    const boostGigId = searchParams.get('boost')
    if (boostGigId) {
      setForm({ ...EMPTY_FORM, gig_id: boostGigId })
      setShowCreate(true)
    }
  }, [searchParams])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [adsRes, gigsRes, walletRes] = await Promise.all([
      supabase.from('gig_ads').select('*, gigs(title)').eq('brand_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('gigs').select('id, title, influencer_limit, collaborations(id)').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('brand_wallet').select('balance').eq('brand_user_id', user.id).maybeSingle(),
    ])

    const loadedAds = (adsRes.data as unknown as GigAd[]) ?? []
    setAds(loadedAds)
    // Map gigs to include accepted_count and filter out fully filled ones
    const rawGigs = (gigsRes.data ?? []) as (Omit<Gig, 'accepted_count'> & { collaborations?: { id: string }[]; influencer_limit: number | null })[]
    const mappedGigs: Gig[] = rawGigs.map(g => ({
      id: g.id,
      title: g.title,
      influencer_limit: g.influencer_limit ?? null,
      accepted_count: (g.collaborations ?? []).length,
    }))
    setGigs(mappedGigs)
    setWallet((walletRes.data as { balance: number } | null)?.balance ?? 0)

    if (loadedAds.length > 0) {
      const adIds = loadedAds.map(a => a.id)
      const [txnRes, evRes] = await Promise.all([
        supabase.from('wallet_transactions').select('ad_id, total_amount, gst_amount').eq('type', 'debit').in('ad_id', adIds),
        supabase.from('ad_events').select('ad_id, event_type').in('ad_id', adIds),
      ])
      const sm: Record<string, { total: number; gst: number }> = {}
      ;((txnRes.data ?? []) as { ad_id: string; total_amount: number; gst_amount: number }[]).forEach(t => {
        if (!sm[t.ad_id]) sm[t.ad_id] = { total: 0, gst: 0 }
        sm[t.ad_id].total += t.total_amount
        sm[t.ad_id].gst += t.gst_amount
      })
      setSpendMap(sm)
      const em: Record<string, { impressions: number; views: number; pitches: number }> = {}
      ;((evRes.data ?? []) as { ad_id: string; event_type: string }[]).forEach(e => {
        if (!em[e.ad_id]) em[e.ad_id] = { impressions: 0, views: 0, pitches: 0 }
        if (e.event_type === 'impression') em[e.ad_id].impressions++
        else if (e.event_type === 'view') em[e.ad_id].views++
        else if (e.event_type === 'pitch_click') em[e.ad_id].pitches++
      })
      setEventMap(em)
    }
    setLoading(false)
  }

  const dailyBudget = parseFloat(form.daily_budget) || 0
  const dailyGST = dailyBudget * GST
  const dailyTotal = dailyBudget + dailyGST
  const daysCanRun = dailyTotal > 0 ? Math.floor(wallet / dailyTotal) : 0

  async function ensureWallet(uid: string) {
    const supabase = createClient()
    await supabase.from('brand_wallet').upsert({ brand_user_id: uid, balance: 0 }, { onConflict: 'brand_user_id', ignoreDuplicates: true })
  }

  async function addFunds() {
    const amount = parseFloat(fundAmount)
    if (!amount || amount < 1) { toast.error('Enter a valid amount'); return }
    if (!userId) return
    setActing(true)
    const supabase = createClient()
    await ensureWallet(userId)
    const newBal = wallet + amount
    const { error: wErr } = await supabase.from('brand_wallet').update({ balance: newBal, updated_at: new Date().toISOString() }).eq('brand_user_id', userId)
    if (wErr) {
      const { error: iErr } = await supabase.from('brand_wallet').insert({ brand_user_id: userId, balance: amount })
      if (iErr) { toast.error(iErr.message); setActing(false); return }
    }
    await supabase.from('wallet_transactions').insert({
      brand_user_id: userId, type: 'credit', amount, gst_amount: 0,
      total_amount: amount, description: 'Funds added to wallet',
      date: new Date().toISOString().split('T')[0],
    })
    toast.success(`${fmt(amount)} added to your wallet!`)
    setWallet(newBal)
    setShowAddFunds(false)
    setFundAmount('500')
    setActing(false)
  }

  async function submitAd(isEdit: boolean) {
    if (!form.gig_id) { toast.error('Select a gig to promote'); return }
    const daily = parseFloat(form.daily_budget)
    if (!daily || daily < 85) { toast.error('Minimum daily budget is ₹85'); return }
    if (!form.start_date) { toast.error('Set a start date'); return }
    if (!form.run_continuously && !form.end_date) { toast.error('Set an end date or choose "Run continuously"'); return }
    if (!form.run_continuously && form.end_date && new Date(form.end_date) <= new Date(form.start_date)) {
      toast.error('End date must be after start date'); return
    }
    if (wallet <= 0) { toast.error('Your wallet is empty. Please add funds first.'); setShowAddFunds(true); return }

    setActing(true)
    const supabase = createClient()
    const payload = {
      gig_id: form.gig_id,
      brand_user_id: userId,
      daily_budget: daily,
      total_budget: null,
      run_continuously: form.run_continuously,
      start_date: form.start_date,
      end_date: form.run_continuously ? null : form.end_date,
      status: 'pending',
      strike: false,
    }

    let error
    if (isEdit && editAdId) {
      ;({ error } = await supabase.from('gig_ads').update(payload).eq('id', editAdId))
    } else {
      ;({ error } = await supabase.from('gig_ads').insert(payload))
    }

    if (error) { toast.error(error.message); setActing(false); return }
    toast.success(isEdit ? 'Ad updated!' : 'Ad submitted for review!')
    setShowCreate(false)
    setShowEdit(false)
    setEditAdId(null)
    setForm(EMPTY_FORM)
    setActing(false)
    load()
  }

  async function deleteAd(id: string) {
    if (!confirm('Remove this ad?')) return
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Ad removed')
    load()
  }

  async function togglePause(ad: GigAd) {
    const supabase = createClient()
    const next = ad.status === 'active' ? 'paused' : 'active'
    await supabase.from('gig_ads').update({ status: next }).eq('id', ad.id)
    load()
  }

  function openEdit(ad: GigAd) {
    setForm({
      gig_id: ad.gig_id,
      daily_budget: String(ad.daily_budget),
      run_continuously: ad.run_continuously,
      start_date: ad.start_date,
      end_date: ad.end_date ?? '',
    })
    setEditAdId(ad.id)
    setShowEdit(true)
  }

  function closeModal() {
    setShowCreate(false)
    setShowEdit(false)
    setEditAdId(null)
    setForm(EMPTY_FORM)
  }

  const modalOpen = showCreate || showEdit
  const isEditMode = showEdit

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="dash-page-title">Gig Ads</div>
          <div className="dash-page-subtitle">Promote your gigs to the top — get more pitches from top creators.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowAddFunds(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Wallet size={15} /> {fmt(wallet)}
          </button>
          <button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.3)', fontFamily: 'inherit' }}>
            <Plus size={16} /> Create Ad
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { n: '1', title: 'Top Up Wallet', desc: 'Add prepaid funds. Ads deduct daily budget + 18% GST.' },
          { n: '2', title: 'Create & Submit', desc: 'Pick a gig, set ₹85+/day. Admin reviews within 24h.' },
          { n: '3', title: 'Get Seen First', desc: 'Your gig pins to the top for all creators until balance runs out.' },
        ].map(s => (
          <div key={s.n} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{s.n}</div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Ad list */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          [1, 2].map(i => <div key={i} className="dash-skel" style={{ height: 110, borderRadius: 18 }} />)
        ) : ads.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)' }}>
            <div className="dash-empty">
              <div className="dash-empty-icon"><Megaphone size={20} /></div>
              <div className="dash-empty-title">No ads yet</div>
              <div className="dash-empty-sub">Create your first gig ad to start getting priority visibility.</div>
            </div>
          </div>
        ) : ads.map(ad => {
          const dailyCharge = ad.daily_budget * 1.18
          const spend = spendMap[ad.id]
          const events = eventMap[ad.id]
          const ctr = events && events.views > 0 ? ((events.pitches / events.views) * 100).toFixed(2) : '0.00'
          const isLive = ad.status === 'active' || ad.status === 'paused'
          return (
            <motion.div key={ad.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--bg-card)', border: ad.strike ? '1.5px solid #fca5a5' : '1px solid var(--bg-border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>

              <div style={{ padding: '18px 22px' }}>
              {ad.strike && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fee2e2', borderRadius: 10, marginBottom: 14, fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                  <AlertTriangle size={14} /> Strike: {ad.strike_reason ?? 'Policy violation'}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Megaphone size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    {(ad.gigs as unknown as { title: string } | null)?.title ?? 'Gig'}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    ₹{ad.daily_budget}/day + GST = <strong>₹{dailyCharge.toFixed(2)}/day charged</strong>
                    {' · '}
                    {new Date(ad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {ad.run_continuously
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Infinity size={12} /> Continuous</span>
                      : ad.end_date ? new Date(ad.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: statusBg[ad.status] ?? '#f9fafb', color: statusColor[ad.status] ?? '#6b7280' }}>
                    {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                  </span>

                  {/* Edit available on pending + paused; Delete always available */}
                  {(ad.status === 'pending' || ad.status === 'paused') && (
                    <button onClick={() => openEdit(ad)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                  {ad.status !== 'active' && (
                    <button onClick={() => deleteAd(ad.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                  {(ad.status === 'active' || ad.status === 'paused') && !ad.strike && (
                    <button onClick={() => togglePause(ad)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {ad.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                    </button>
                  )}
                </div>
              </div>
              </div>

              {/* Analytics strip — only for live ads */}
              {isLive && (
                <div style={{ padding: '12px 22px', background: 'linear-gradient(135deg,#f8faff,#eff6ff)', borderTop: '1px solid #e0e7ff', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0 }}>
                  {[
                    { icon: <IndianRupee size={11} />, label: 'Spent', value: fmt(spend?.total ?? 0), color: '#f59e0b' },
                    { icon: <Eye size={11} />, label: 'Impressions', value: String(events?.impressions ?? 0), color: '#1d4ed8' },
                    { icon: <BarChart2 size={11} />, label: 'Views', value: String(events?.views ?? 0), color: '#0ea5e9' },
                    { icon: <Send size={11} />, label: 'Pitches', value: String(events?.pitches ?? 0), color: '#8b5cf6' },
                    { icon: <TrendingUp size={11} />, label: 'CTR', value: `${ctr}%`, color: '#10b981' },
                  ].map((m, i) => (
                    <div key={m.label} style={{ padding: '6px 14px', borderRight: i < 4 ? '1px solid #e0e7ff' : 'none', textAlign: i === 0 ? 'left' : 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: i === 0 ? 'flex-start' : 'center', color: m.color, marginBottom: 2 }}>
                        {m.icon}
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{m.label}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ── Create / Edit Modal — inlined JSX, NOT a nested component ─────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <motion.div key="ad-modal" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#111827' }}>{isEditMode ? 'Edit Ad Campaign' : 'Create Gig Ad'}</div>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
              </div>

              {/* Wallet strip */}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: wallet <= 0 ? '#fff1f2' : daysCanRun < 3 ? '#fef3c7' : '#ecfdf5', border: `1.5px solid ${wallet <= 0 ? '#fca5a5' : daysCanRun < 3 ? '#fde68a' : '#a7f3d0'}`, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: wallet <= 0 ? '#b91c1c' : '#374151' }}>
                    Wallet: <span style={{ fontSize: 15, color: wallet <= 0 ? '#ef4444' : '#10b981' }}>{fmt(wallet)}</span>
                  </div>
                  {dailyTotal > 0 && wallet > 0 && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {daysCanRun} day{daysCanRun !== 1 ? 's' : ''} at ₹{dailyTotal.toFixed(2)}/day (incl. GST)
                    </div>
                  )}
                  {wallet <= 0 && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Add funds to launch your ad</div>}
                </div>
                <button onClick={() => setShowAddFunds(true)} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  + Add Funds
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Gig */}
                <div>
                  <label style={lbl}>Select Gig *</label>
                  <select value={form.gig_id} onChange={e => setForm(p => ({ ...p, gig_id: e.target.value }))} style={inp}>
                    <option value="">Choose a gig to promote...</option>
                    {gigs
                      .filter(g => g.influencer_limit === null || g.accepted_count < g.influencer_limit)
                      .map(g => {
                        const remaining = g.influencer_limit !== null ? g.influencer_limit - g.accepted_count : null
                        return (
                          <option key={g.id} value={g.id}>
                            {g.title}{remaining !== null ? ` (${remaining} slot${remaining !== 1 ? 's' : ''} left)` : ''}
                          </option>
                        )
                      })
                    }
                  </select>
                </div>

                {/* Budget — GST box always rendered to prevent height shift */}
                <div>
                  <label style={lbl}>Daily Budget (₹, excl. GST) *</label>
                  <input
                    type="number" min={85}
                    value={form.daily_budget}
                    onChange={e => setForm(p => ({ ...p, daily_budget: e.target.value }))}
                    placeholder="Min ₹85"
                    style={inp}
                  />
                  <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: '#f8faff', border: '1px solid #e0e7ff', visibility: dailyBudget >= 85 ? 'visible' : 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#374151', marginBottom: 4 }}>
                      <span>Daily budget</span><span>₹{dailyBudget.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#374151', marginBottom: 4 }}>
                      <span>GST (18%)</span><span>₹{dailyGST.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800, color: '#1d4ed8', borderTop: '1px solid #e0e7ff', paddingTop: 6 }}>
                      <span>Daily total charged</span><span>₹{dailyTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label style={lbl}>Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} style={inp} min={new Date().toISOString().split('T')[0]} />
                </div>

                {/* Campaign end */}
                <div>
                  <label style={lbl}>Campaign End</label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    {([
                      { val: true, Icon: Infinity, label: 'Run continuously' },
                      { val: false, Icon: Calendar, label: 'Set end date' },
                    ] as const).map(opt => (
                      <button key={String(opt.val)} type="button"
                        onClick={() => setForm(p => ({ ...p, run_continuously: opt.val }))}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${form.run_continuously === opt.val ? '#1d4ed8' : '#e5e7eb'}`, background: form.run_continuously === opt.val ? '#eff6ff' : '#f9fafb', color: form.run_continuously === opt.val ? '#1d4ed8' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <opt.Icon size={14} /> {opt.label}
                      </button>
                    ))}
                  </div>
                  {/* Fixed height placeholder so modal doesn't resize */}
                  <div style={{ minHeight: 44 }}>
                    {!form.run_continuously && (
                      <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} style={inp} min={form.start_date || new Date().toISOString().split('T')[0]} />
                    )}
                    {form.run_continuously && (
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, paddingTop: 10 }}>
                        <Info size={12} /> Ad runs until your wallet runs out or you manually stop it.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button onClick={closeModal} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={() => submitAd(isEditMode)} disabled={acting} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: acting ? '#fde68a' : 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                  <Megaphone size={15} /> {acting ? 'Saving...' : isEditMode ? 'Update Campaign' : 'Submit for Review'} <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFunds && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 16 }}>
            <motion.div key="funds-modal" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>Add Funds</div>
                <button onClick={() => setShowAddFunds(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 14, background: '#f0fdf4', border: '1.5px solid #a7f3d0', marginBottom: 20 }}>
                <div style={{ fontSize: 12.5, color: '#374151' }}>Current wallet balance</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981' }}>{fmt(wallet)}</div>
              </div>

              <label style={lbl}>Amount to Add (₹)</label>
              <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="Enter amount" style={{ ...inp, marginBottom: 12 }} min={1} />

              <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                {[500, 1000, 2000, 5000].map(amt => (
                  <button key={amt} onClick={() => setFundAmount(String(amt))} style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${fundAmount === String(amt) ? '#1d4ed8' : '#e5e7eb'}`, background: fundAmount === String(amt) ? '#eff6ff' : '#f9fafb', color: fundAmount === String(amt) ? '#1d4ed8' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {parseFloat(fundAmount) > 0 && (
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  After adding: <strong style={{ color: '#111827' }}>{fmt(wallet + parseFloat(fundAmount))}</strong>
                  {dailyTotal > 0 && <span style={{ color: '#10b981' }}> ({Math.floor((wallet + parseFloat(fundAmount)) / dailyTotal)} days at current budget)</span>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAddFunds(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={addFunds} disabled={acting} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: acting ? '#93c5fd' : 'linear-gradient(135deg,#1d4ed8,#06b6d4)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                  <PlusIcon size={15} /> {acting ? 'Adding...' : `Add ${fundAmount ? fmt(parseFloat(fundAmount)) : 'Funds'}`}
                </button>
              </div>

              <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
                Funds are prepaid and non-refundable. Ads deduct daily budget + 18% GST.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
