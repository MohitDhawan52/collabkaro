'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Plus, IndianRupee, Pause, Play, AlertTriangle, Inbox, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface Gig { id: string; title: string }
interface GigAd {
  id: string
  gig_id: string
  daily_budget: number
  total_budget: number
  start_date: string
  end_date: string
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'ended'
  strike: boolean
  strike_reason: string | null
  created_at: string
  gigs?: { title: string } | null
}

export default function BrandAdsPage() {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<GigAd[]>([])
  const [gigs, setGigs] = useState<Gig[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [form, setForm] = useState({ gig_id: '', daily_budget: '85', total_budget: '', start_date: '', end_date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [adsRes, gigsRes] = await Promise.all([
      supabase.from('gig_ads').select('*, gigs(title)').eq('brand_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('gigs').select('id, title').eq('status', 'active').order('created_at', { ascending: false }),
    ])

    setAds((adsRes.data as unknown as GigAd[]) ?? [])
    setGigs(gigsRes.data ?? [])
    setLoading(false)
  }

  async function createAd() {
    if (!form.gig_id) { toast.error('Select a gig to promote'); return }
    const daily = parseInt(form.daily_budget)
    const total = parseInt(form.total_budget)
    if (!daily || daily < 85) { toast.error('Minimum daily budget is ₹85'); return }
    if (!total || total < daily) { toast.error('Total budget must be at least equal to daily budget'); return }
    if (!form.start_date || !form.end_date) { toast.error('Set start and end dates'); return }
    if (new Date(form.end_date) <= new Date(form.start_date)) { toast.error('End date must be after start date'); return }

    const supabase = createClient()
    const { error } = await supabase.from('gig_ads').insert({
      gig_id: form.gig_id,
      brand_user_id: userId,
      daily_budget: daily,
      total_budget: total,
      start_date: form.start_date,
      end_date: form.end_date,
      status: 'pending',
      strike: false,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Ad submitted for review! It will go live once admin approves.')
    setShowCreate(false)
    setForm({ gig_id: '', daily_budget: '85', total_budget: '', start_date: '', end_date: '' })
    load()
  }

  async function togglePause(ad: GigAd) {
    const supabase = createClient()
    const next = ad.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('gig_ads').update({ status: next }).eq('id', ad.id)
    if (error) { toast.error(error.message); return }
    toast.success(next === 'paused' ? 'Ad paused' : 'Ad resumed')
    load()
  }

  const statusColor: Record<string, string> = {
    pending: '#f59e0b', active: '#10b981', paused: '#6b7280', rejected: '#ef4444', ended: '#9ca3af'
  }
  const statusBg: Record<string, string> = {
    pending: '#fef3c7', active: '#ecfdf5', paused: '#f3f4f6', rejected: '#fee2e2', ended: '#f9fafb'
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', background: '#f9fafb',
    color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="dash-page-title">Gig Ads</div>
          <div className="dash-page-subtitle">Promote your gigs to the top — get more pitches from top creators.</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.3)', fontFamily: 'inherit' }}>
          <Plus size={16} /> Create Ad
        </button>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { n: '1', title: 'Choose a Gig', desc: 'Pick any of your active gigs to promote.' },
          { n: '2', title: 'Set Budget', desc: 'Min ₹85/day. Set total campaign budget.' },
          { n: '3', title: 'Get Seen First', desc: 'Your gig appears pinned at the top for all creators.' },
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
        ) : ads.map(ad => (
          <motion.div key={ad.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', border: ad.strike ? '1.5px solid #fca5a5' : '1px solid var(--bg-border)', borderRadius: 18, padding: '18px 22px', boxShadow: 'var(--shadow-card)' }}>
            {ad.strike && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fee2e2', borderRadius: 10, marginBottom: 14, fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Strike issued: {ad.strike_reason ?? 'Policy violation'}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Megaphone size={18} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{(ad.gigs as unknown as { title: string } | null)?.title ?? 'Gig'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  ₹{ad.daily_budget}/day · Total: ₹{ad.total_budget} · {new Date(ad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(ad.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: statusBg[ad.status] ?? '#f9fafb', color: statusColor[ad.status] ?? '#6b7280' }}>
                  {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                </span>
                {(ad.status === 'active' || ad.status === 'paused') && !ad.strike && (
                  <button onClick={() => togglePause(ad)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {ad.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Ad Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111827' }}>Create Gig Ad</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Select Gig *</label>
                <select value={form.gig_id} onChange={e => setForm(p => ({ ...p, gig_id: e.target.value }))} style={inp}>
                  <option value="">Choose a gig to promote...</option>
                  {gigs.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Daily Budget (₹) *</label>
                  <input type="number" min={85} value={form.daily_budget} onChange={e => setForm(p => ({ ...p, daily_budget: e.target.value }))} placeholder="Min ₹85" style={inp} />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Minimum ₹85/day</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Total Budget (₹) *</label>
                  <input type="number" value={form.total_budget} onChange={e => setForm(p => ({ ...p, total_budget: e.target.value }))} placeholder="e.g. 2000" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} style={inp} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>End Date *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} style={inp} min={form.start_date || new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={createAd} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <Megaphone size={15} /> Submit Ad for Review <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
