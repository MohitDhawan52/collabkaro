'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, AlertTriangle, CheckCircle2, XCircle, Pause, Play, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface GigAd {
  id: string
  gig_id: string
  brand_user_id: string
  daily_budget: number
  total_budget: number
  start_date: string
  end_date: string
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'ended'
  strike: boolean
  strike_reason: string | null
  created_at: string
  gigs?: { title: string; brand_id: string } | null
  brand_profiles?: { company_name: string } | null
}

export default function AdminAdsPage() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<GigAd[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'paused' | 'rejected'>('pending')
  const [strikeModal, setStrikeModal] = useState<string | null>(null)
  const [strikeReason, setStrikeReason] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gig_ads')
      .select('*, gigs(title, brand_id), brand_profiles!gig_ads_brand_user_id_fkey(company_name)')
      .order('created_at', { ascending: false })
    if (error) {
      // Try without the join fallback
      const { data: d2 } = await supabase.from('gig_ads').select('*, gigs(title)').order('created_at', { ascending: false })
      setAds((d2 as unknown as GigAd[]) ?? [])
    } else {
      setAds((data as unknown as GigAd[]) ?? [])
    }
    setLoading(false)
  }

  async function approve(id: string) {
    setActing(true)
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').update({ status: 'active' }).eq('id', id)
    if (error) { toast.error(error.message); setActing(false); return }
    toast.success('Ad approved & now live')
    setActing(false)
    load()
  }

  async function reject(id: string) {
    setActing(true)
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').update({ status: 'rejected' }).eq('id', id)
    if (error) { toast.error(error.message); setActing(false); return }
    toast.success('Ad rejected')
    setActing(false)
    load()
  }

  async function issueStrike(id: string) {
    if (!strikeReason.trim()) { toast.error('Enter reason for strike'); return }
    setActing(true)
    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').update({ strike: true, strike_reason: strikeReason, status: 'paused' }).eq('id', id)
    if (error) { toast.error(error.message); setActing(false); return }
    toast.success('Strike issued and ad paused')
    setStrikeModal(null)
    setStrikeReason('')
    setActing(false)
    load()
  }

  async function removeStrike(id: string) {
    const supabase = createClient()
    await supabase.from('gig_ads').update({ strike: false, strike_reason: null }).eq('id', id)
    toast.success('Strike removed')
    load()
  }

  async function toggleStatus(ad: GigAd) {
    const supabase = createClient()
    const next = ad.status === 'active' ? 'paused' : 'active'
    await supabase.from('gig_ads').update({ status: next }).eq('id', ad.id)
    load()
  }

  const filtered = ads.filter(a => filter === 'all' || a.status === filter)
  const statusColor: Record<string, string> = { pending: '#f59e0b', active: '#10b981', paused: '#6b7280', rejected: '#ef4444', ended: '#9ca3af' }
  const statusBg: Record<string, string> = { pending: '#fef3c7', active: '#ecfdf5', paused: '#f3f4f6', rejected: '#fee2e2', ended: '#f9fafb' }

  return (
    <div>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Megaphone size={22} style={{ color: '#f59e0b' }} />
        Gig Ads Management
      </div>
      <div className="dash-page-subtitle">Review, approve, pause and moderate all brand gig ads.</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
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

      {/* List */}
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
          return (
            <motion.div key={ad.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', border: ad.strike ? '1.5px solid #fca5a5' : '1px solid var(--bg-border)', borderRadius: 18, padding: '20px 22px', boxShadow: 'var(--shadow-card)' }}>
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
                    {brand?.company_name ?? 'Brand'} · ₹{ad.daily_budget}/day · Total ₹{ad.total_budget}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(ad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(ad.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Created {new Date(ad.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
                </div>
              </div>
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
