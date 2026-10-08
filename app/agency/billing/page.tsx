'use client'

import { useState } from 'react'
import { Package, Zap, Phone, CheckCircle2, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'

// ₹49 + 18% GST per gig. Bulk pack = 10 gigs at 30% off.
// 10 × ₹49 × 0.70 = ₹343 base + 18% GST ≈ ₹404.74
const PACKS = [
  {
    id: 'single',
    label: 'Single Gig',
    icon: Zap,
    gigs: 1,
    basePerGig: 49,
    discount: 0,
    totalBase: 49,
    totalGST: 49 * 0.18,
    totalIncl: Math.round(49 * 1.18 * 100) / 100,
    perGigIncl: Math.round(49 * 1.18 * 100) / 100,
    color: '#FF5533',
    bg: 'rgba(255,85,51,0.06)',
    border: 'rgba(255,85,51,0.25)',
    popular: false,
  },
  {
    id: 'bulk10',
    label: '10-Gig Pack',
    icon: Package,
    gigs: 10,
    basePerGig: 49 * 0.7,
    discount: 30,
    totalBase: 10 * 49 * 0.7,
    totalGST: 10 * 49 * 0.7 * 0.18,
    totalIncl: Math.round(10 * 49 * 0.7 * 1.18 * 100) / 100,
    perGigIncl: Math.round(49 * 0.7 * 1.18 * 100) / 100,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.25)',
    popular: true,
  },
]

interface ContactForm { name: string; phone: string; company: string; monthly_gigs: string; message: string }

export default function AgencyBillingPage() {
  const [contactForm, setContactForm] = useState<ContactForm>({ name: '', phone: '', company: '', monthly_gigs: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submitContact(e: React.FormEvent) {
    e.preventDefault()
    if (!contactForm.name || !contactForm.phone) { toast.error('Name and phone are required'); return }
    setSending(true)
    // In production this would hit an API route that sends email/Slack notification
    await new Promise(r => setTimeout(r, 1000))
    setSent(true)
    setSending(false)
    toast.success('Request sent! Our team will contact you within 24 hours.')
  }

  return (
    <div>
      <div className="dash-page-title">Billing & Plans</div>
      <div className="dash-page-subtitle">Gig listing packs and enterprise options for high-volume agencies.</div>

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 22 }}>
        {PACKS.map(pack => {
          const Icon = pack.icon
          return (
            <div key={pack.id} style={{ background: pack.bg, border: `2px solid ${pack.border}`, borderRadius: 20, padding: '24px 22px', position: 'relative' }}>
              {pack.popular && (
                <div style={{ position: 'absolute', top: -10, right: 16, background: '#FF5533', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99, letterSpacing: 0.5 }}>BEST VALUE</div>
              )}
              {pack.discount > 0 && (
                <div style={{ position: 'absolute', top: -10, left: 16, background: '#059669', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '3px 10px', borderRadius: 99 }}>{pack.discount}% OFF</div>
              )}
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `${pack.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={20} color={pack.color} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>{pack.label}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{pack.gigs} gig{pack.gigs > 1 ? 's' : ''} · valid until used</div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: pack.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                  ₹{pack.totalIncl}
                </div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 4 }}>
                  incl. 18% GST · ₹{pack.perGigIncl}/gig
                </div>
                {pack.discount > 0 && (
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', textDecoration: 'line-through', marginTop: 2 }}>
                    was ₹{Math.round(49 * pack.gigs * 1.18 * 100) / 100} ({pack.gigs} × ₹57.82)
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
                {[
                  `${pack.gigs} gig listing${pack.gigs > 1 ? 's' : ''}`,
                  'Influencer applications',
                  'Collab management',
                  'Campaign reports',
                  ...(pack.discount > 0 ? ['Agency branding on gigs', 'Priority support'] : []),
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={13} color={pack.color} />
                    <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                  </div>
                ))}
              </div>

              <button style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', background: pack.color, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => toast.info('Payment integration coming soon. Contact us to purchase.')}>
                Purchase Pack
              </button>
            </div>
          )
        })}
      </div>

      {/* Enterprise / Contact Sales */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(79,70,229,0.08))', border: '1.5px solid rgba(124,58,237,0.20)', borderRadius: 20, padding: '28px 26px', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={19} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111113', fontFamily: "'Outfit', sans-serif" }}>Enterprise — 35+ Gigs/Month</div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>Custom pricing, dedicated account manager, invoicing</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 22, marginTop: 16 }}>
          {['Custom volume pricing', 'Dedicated account manager', 'Monthly invoicing (GST)', 'White-label reports', 'API access', 'Priority influencer matching'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle2 size={13} color="#7C3AED" />
              <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
            </div>
          ))}
        </div>

        {sent ? (
          <div style={{ padding: '16px 20px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.20)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="#059669" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Request sent!</div>
              <div style={{ fontSize: 12.5, color: '#059669' }}>Our team will contact you within 24 hours.</div>
            </div>
          </div>
        ) : (
          <form onSubmit={submitContact}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { key: 'name', label: 'Your Name *', placeholder: 'Rahul Gupta', type: 'text' },
                { key: 'phone', label: 'Phone Number *', placeholder: '+91 98765 43210', type: 'tel' },
                { key: 'company', label: 'Agency Name', placeholder: 'MonkWise Media', type: 'text' },
                { key: 'monthly_gigs', label: 'Est. Gigs/Month', placeholder: '50–100', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input type={f.type} value={contactForm[f.key as keyof ContactForm]} onChange={e => setContactForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid rgba(124,58,237,0.20)', background: '#fff', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }}>Message (optional)</label>
              <textarea value={contactForm.message} onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))} rows={3} placeholder="Tell us about your campaigns and volume needs…" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid rgba(124,58,237,0.20)', background: '#fff', fontSize: 13.5, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={sending} style={{ marginTop: 14, padding: '12px 28px', borderRadius: 10, border: 'none', background: sending ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {sending ? 'Sending…' : 'Contact Sales'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
