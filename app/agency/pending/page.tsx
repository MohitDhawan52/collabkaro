'use client'

import Link from 'next/link'
import { Clock, CheckCircle2, Mail, ArrowRight } from 'lucide-react'

export default function AgencyPendingPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3', padding: '32px 16px', fontFamily: 'inherit' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, fontFamily: "'Outfit', sans-serif" }}>C</span>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: '#111113', letterSpacing: '-0.4px' }}>CollabKaro</span>
        </Link>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #EBEBEB', borderRadius: 24, padding: '48px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(124,58,237,0.10)', border: '2px solid rgba(124,58,237,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={32} color="#7C3AED" />
          </div>

          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 800, color: '#111113', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            Application Submitted!
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, margin: '0 0 32px' }}>
            Your agency application is under review. Our team will verify your details and approve your account within <strong style={{ color: '#111113' }}>24–48 hours</strong>.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36, textAlign: 'left' }}>
            {[
              { icon: CheckCircle2, color: '#10B981', text: 'Application received successfully' },
              { icon: Clock,        color: '#7C3AED', text: 'Team reviewing agency details (24–48 hrs)' },
              { icon: Mail,         color: '#F59E0B', text: 'Approval email sent to your inbox' },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F7F6F3', borderRadius: 12 }}>
                <Icon size={18} color={color} />
                <span style={{ fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#7C3AED', color: '#fff', borderRadius: 11, textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 3px 12px rgba(124,58,237,0.28)' }}>
            Back to Home <ArrowRight size={14} />
          </Link>
        </div>

        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 20 }}>
          Questions? Email us at{' '}
          <a href="mailto:support@collabkaro.in" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>support@collabkaro.in</a>
        </p>
      </div>
    </div>
  )
}
