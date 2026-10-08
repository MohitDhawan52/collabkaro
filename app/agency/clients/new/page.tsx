'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, User, Mail, Phone, MapPin, Briefcase, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid #EBEBEB', fontSize: 14, color: '#111113', background: '#FAFAF9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const inpNoIcon: React.CSSProperties = { ...inp, paddingLeft: 14 }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }
const iconPos: React.CSSProperties = { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }

const INDUSTRIES = ['Fashion', 'Beauty', 'Food & Beverage', 'Travel', 'Fitness & Wellness', 'Tech', 'Gaming', 'Lifestyle', 'Finance', 'Education', 'Real Estate', 'Retail', 'Automotive', 'Healthcare', 'Other']

interface Form {
  company_name: string; contact_name: string; contact_email: string
  contact_phone: string; industry: string; city: string; notes: string
}

export default function AddClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState<Form>({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', industry: '', city: '', notes: '' })

  function set<K extends keyof Form>(k: K, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) { toast.error('Company name is required'); return }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setLoading(false); return }

    const { data: agency } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).single()
    if (!agency) { toast.error('Agency profile not found'); setLoading(false); return }

    const { error } = await supabase.from('agency_manual_clients').insert({
      agency_id: (agency as unknown as { id: string }).id,
      company_name: form.company_name.trim(),
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      industry: form.industry || null,
      city: form.city || null,
      notes: form.notes || null,
    })

    setLoading(false)
    if (error) { toast.error(error.message); return }

    setDone(true)
    toast.success(`${form.company_name} added as a client!`)
    setTimeout(() => router.push('/agency/clients'), 1400)
  }

  if (done) return (
    <div style={{ maxWidth: 480, textAlign: 'center', paddingTop: 60 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(5,150,105,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCircle2 size={30} color="#059669" />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111113' }}>Client added!</div>
      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Redirecting to clients list…</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="dash-page-title">Add Client</div>
      <div className="dash-page-subtitle">Fill in your client's details — no CollabKaro account needed.</div>

      <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 18, padding: '28px 24px', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111113' }}>New Client</div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>Add a brand you manage for campaigns</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Company name */}
          <div>
            <label style={lbl}>Company / Brand Name <span style={{ color: '#FF5533' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Building2 size={14} style={iconPos} />
              <input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Taneja Furniture" style={inp} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Contact Person</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={iconPos} />
                <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Rahul Taneja" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={iconPos} />
                <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+91 98765 43210" style={inp} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={iconPos} />
                <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="brand@company.com" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>City</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={iconPos} />
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" style={inp} />
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>Industry</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={14} style={iconPos} />
              <select value={form.industry} onChange={e => set('industry', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Notes</label>
            <div style={{ position: 'relative' }}>
              <FileText size={14} style={{ ...iconPos, top: 16, transform: 'none' }} />
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Budget range, campaign type, any other info…" style={{ ...inp, paddingLeft: 38, resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #EBEBEB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
