'use client'

import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface CampaignReport {
  gig_id: string
  gig_title: string
  company_name: string
  total_applied: number
  total_active: number
  total_completed: number
  total_spend: number
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default function AgencyReportsPage() {
  const [reports, setReports] = useState<CampaignReport[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ gigs: 0, collabs: 0, completed: 0, spend: 0 })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { setLoading(false); return }
    const aid = (agency as unknown as { id: string }).id

    // Fetch gigs + their collaborations
    const { data: gigs } = await supabase.from('gigs').select('id, title, brand_profiles(company_name)').eq('agency_id', aid)
    if (!gigs || gigs.length === 0) { setLoading(false); return }

    const gigIds = (gigs as unknown as { id: string }[]).map(g => g.id)
    const { data: collabs } = await supabase.from('collaborations').select('gig_id, status, agreed_amount').in('gig_id', gigIds)

    const collabMap: Record<string, { applied: number; active: number; completed: number; spend: number }> = {}
    for (const g of gigIds) collabMap[g] = { applied: 0, active: 0, completed: 0, spend: 0 }

    for (const c of (collabs ?? []) as unknown as { gig_id: string; status: string; agreed_amount: number | null }[]) {
      if (!collabMap[c.gig_id]) continue
      collabMap[c.gig_id].applied++
      if (['active', 'deliverable_submitted', 'completed'].includes(c.status)) collabMap[c.gig_id].active++
      if (c.status === 'completed') { collabMap[c.gig_id].completed++; collabMap[c.gig_id].spend += c.agreed_amount ?? 0 }
    }

    const rows = (gigs as unknown as { id: string; title: string; brand_profiles: { company_name: string } }[]).map(g => ({
      gig_id: g.id, gig_title: g.title, company_name: g.brand_profiles?.company_name ?? '—',
      total_applied: collabMap[g.id]?.applied ?? 0,
      total_active:  collabMap[g.id]?.active ?? 0,
      total_completed: collabMap[g.id]?.completed ?? 0,
      total_spend: collabMap[g.id]?.spend ?? 0,
    }))

    setReports(rows)
    setTotals({
      gigs: rows.length,
      collabs: rows.reduce((s, r) => s + r.total_applied, 0),
      completed: rows.reduce((s, r) => s + r.total_completed, 0),
      spend: rows.reduce((s, r) => s + r.total_spend, 0),
    })
    setLoading(false)
  }

  function downloadCSV() {
    const header = ['Gig Title', 'Client', 'Applied', 'Active', 'Completed', 'Total Spend (INR)']
    const rows = reports.map(r => [r.gig_title, r.company_name, r.total_applied, r.total_active, r.total_completed, r.total_spend])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'campaign-report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const SUMMARY = [
    { label: 'Total Gigs', value: totals.gigs, color: '#7C3AED' },
    { label: 'Total Applications', value: totals.collabs, color: '#FF5533' },
    { label: 'Completed', value: totals.completed, color: '#059669' },
    { label: 'Total Spend', value: formatINR(totals.spend), color: '#B45309' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="dash-page-title" style={{ marginBottom: 0 }}>Campaign Reports</div>
        {reports.length > 0 && (
          <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#fff', border: '1.5px solid #EBEBEB', color: '#374151', borderRadius: 10, fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
      <div className="dash-page-subtitle">Performance summary across all client campaigns.</div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 20 }}>
        {SUMMARY.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {loading ? '—' : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Per-campaign table */}
      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 16, marginTop: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F2EE', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={16} color="#7C3AED" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111113' }}>Per Campaign Breakdown</span>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />)}</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13.5 }}>
            <BarChart2 size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            No campaigns to report yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAFAF9' }}>
                  {['Campaign', 'Client', 'Applied', 'Active', 'Completed', 'Spend'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#9CA3AF', whiteSpace: 'nowrap', borderBottom: '1px solid #EBEBEB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.gig_id} style={{ borderBottom: i < reports.length - 1 ? '1px solid #F3F2EE' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111113', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.gig_title}</td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>{r.company_name}</td>
                    <td style={{ padding: '12px 16px', color: '#6B7280', fontFamily: "'Outfit', sans-serif" }}>{r.total_applied}</td>
                    <td style={{ padding: '12px 16px', color: '#FF5533', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{r.total_active}</td>
                    <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{r.total_completed}</td>
                    <td style={{ padding: '12px 16px', color: '#B45309', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{r.total_spend > 0 ? formatINR(r.total_spend) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
