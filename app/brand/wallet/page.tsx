'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, IndianRupee, Calendar,
  ArrowUpCircle, ArrowDownCircle, BarChart2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  gst_amount: number
  total_amount: number
  description: string | null
  date: string
  created_at: string
  gigs?: { title: string } | null
}

type Range = '7d' | '30d' | 'month' | 'custom'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BrandWalletPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [range, setRange] = useState<Range>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [walletRes, txnRes] = await Promise.all([
      supabase.from('brand_wallet').select('balance').eq('brand_user_id', user.id).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('brand_user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
    ])

    setBalance((walletRes.data as { balance: number } | null)?.balance ?? 0)
    setTxns((txnRes.data as unknown as Transaction[]) ?? [])
    setLoading(false)
  }

  // Date filter
  function getDateRange(): { from: Date; to: Date } {
    const to = new Date(); to.setHours(23, 59, 59, 999)
    const from = new Date()
    if (range === '7d') { from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0) }
    else if (range === '30d') { from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0) }
    else if (range === 'month') { from.setDate(1); from.setHours(0, 0, 0, 0) }
    else if (range === 'custom' && customFrom && customTo) {
      return { from: new Date(customFrom + 'T00:00:00'), to: new Date(customTo + 'T23:59:59') }
    }
    return { from, to }
  }

  const { from, to } = getDateRange()
  const filtered = txns.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d >= from && d <= to
  })

  // Summary stats
  const totalAdded = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.total_amount, 0)
  const totalSpent = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + t.total_amount, 0)
  const totalGST = filtered.filter(t => t.type === 'debit').reduce((s, t) => s + t.gst_amount, 0)

  // Group by date for daily breakdown
  const byDate: Record<string, { date: string; added: number; spent: number; gst: number; txns: Transaction[] }> = {}
  filtered.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = { date: t.date, added: 0, spent: 0, gst: 0, txns: [] }
    if (t.type === 'credit') byDate[t.date].added += t.total_amount
    else { byDate[t.date].spent += t.total_amount; byDate[t.date].gst += t.gst_amount }
    byDate[t.date].txns.push(t)
  })
  const dailyRows = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date))

  const inp: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb',
    background: '#f9fafb', color: '#111827', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  }

  if (loading) return (
    <div>
      <div className="dash-page-title">Ad Payment Activity</div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3].map(i => <div key={i} className="dash-skel" style={{ height: 90, borderRadius: 16 }} />)}
      </div>
    </div>
  )

  return (
    <div>
      <div className="dash-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Wallet size={22} style={{ color: '#1d4ed8' }} />
        Ad Payment Activity
      </div>
      <div className="dash-page-subtitle">Track your ad spend, funds added, and GST breakdown — just like Meta Ads.</div>

      {/* Wallet balance hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: 22, padding: '22px 28px', borderRadius: 20, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', boxShadow: '0 6px 24px rgba(29,78,216,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Available Balance</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{fmt(balance)}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Prepaid · Ads deduct daily at midnight</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{fmt(totalSpent)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Spent (this period)</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{fmt(totalAdded)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Added (this period)</div>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Total Ad Spend', value: fmt(totalSpent - totalGST), sub: 'Excl. GST', icon: BarChart2, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'GST Paid (18%)', value: fmt(totalGST), sub: 'On ad spend', icon: IndianRupee, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Funds Added', value: fmt(totalAdded), sub: 'Credited to wallet', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5' },
        ].map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={17} style={{ color: c.color }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: c.color, marginTop: 2, fontWeight: 600 }}>{c.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Date range filter */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Period:</span>
        {[
          { val: '7d', label: 'Last 7 days' },
          { val: '30d', label: 'Last 30 days' },
          { val: 'month', label: 'This month' },
          { val: 'custom', label: 'Custom' },
        ].map(r => (
          <button key={r.val} onClick={() => setRange(r.val as Range)} style={{ padding: '6px 14px', borderRadius: 9, border: range === r.val ? 'none' : '1px solid var(--bg-border)', background: range === r.val ? '#1d4ed8' : 'var(--bg-card)', color: range === r.val ? '#fff' : 'var(--text-muted)', fontWeight: range === r.val ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {r.label}
          </button>
        ))}
        {range === 'custom' && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inp} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inp} min={customFrom} />
          </>
        )}
      </div>

      {/* Daily breakdown table */}
      <div style={{ marginTop: 18, background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 0, padding: '12px 22px', background: 'var(--bg-input)', borderBottom: '1px solid var(--bg-border)' }}>
          {['Date', 'Ad Spend', 'GST (18%)', 'Total Charged', 'Funds Added'].map(h => (
            <div key={h} style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {dailyRows.length === 0 ? (
          <div className="dash-empty" style={{ padding: '40px 0' }}>
            <div className="dash-empty-icon"><BarChart2 size={20} /></div>
            <div className="dash-empty-title">No activity in this period</div>
            <div className="dash-empty-sub">Try selecting a wider date range or add funds and launch an ad.</div>
          </div>
        ) : dailyRows.map((row, i) => (
          <div key={row.date}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 0, padding: '14px 22px', borderBottom: i < dailyRows.length - 1 ? '1px solid var(--bg-border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{fmtDate(row.date)}</div>
              <div style={{ fontSize: 13.5, color: row.spent > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: row.spent > 0 ? 700 : 400 }}>
                {row.spent > 0 ? fmt(row.spent - row.gst) : '—'}
              </div>
              <div style={{ fontSize: 13.5, color: row.gst > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: row.gst > 0 ? 700 : 400 }}>
                {row.gst > 0 ? fmt(row.gst) : '—'}
              </div>
              <div style={{ fontSize: 13.5, color: row.spent > 0 ? '#374151' : 'var(--text-muted)', fontWeight: row.spent > 0 ? 700 : 400 }}>
                {row.spent > 0 ? fmt(row.spent) : '—'}
              </div>
              <div style={{ fontSize: 13.5, color: row.added > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: row.added > 0 ? 700 : 400 }}>
                {row.added > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ArrowUpCircle size={13} /> {fmt(row.added)}</span> : '—'}
              </div>
            </div>

            {/* Txn sub-rows */}
            {row.txns.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 4fr', gap: 0, padding: '6px 22px 6px 36px', borderBottom: '1px dashed var(--bg-border)', background: 'rgba(0,0,0,0.015)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {t.type === 'credit'
                    ? <ArrowUpCircle size={11} style={{ color: '#10b981', flexShrink: 0 }} />
                    : <ArrowDownCircle size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                  {t.description ?? (t.type === 'credit' ? 'Funds added' : 'Ad spend')}
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: t.type === 'credit' ? '#10b981' : '#f59e0b' }}>
                    {t.type === 'credit' ? '+' : '-'}{fmt(t.total_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Footer totals */}
        {dailyRows.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', padding: '14px 22px', background: 'linear-gradient(135deg,#f0f4ff,#f8faff)', borderTop: '2px solid var(--bg-border)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f59e0b' }}>{fmt(totalSpent - totalGST)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#ef4444' }}>{fmt(totalGST)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#374151' }}>{fmt(totalSpent)}</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#10b981' }}>{fmt(totalAdded)}</div>
          </div>
        )}
      </div>

      {/* Transaction legend */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ArrowUpCircle size={12} style={{ color: '#10b981' }} /> Funds credited to wallet</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ArrowDownCircle size={12} style={{ color: '#f59e0b' }} /> Ad spend deducted (incl. 18% GST)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><TrendingDown size={12} style={{ color: '#ef4444' }} /> GST is non-refundable as per Indian tax law</span>
      </div>
    </div>
  )
}
