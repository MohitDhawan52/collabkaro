'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, LogOut, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function InfluencerPendingPage() {
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: influencer } = await supabase
        .from('influencer_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()

      setName(influencer?.full_name ?? null)
      setLoading(false)
    }

    loadProfile()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md text-center"
      >
        <Link href="/" className="flex justify-center mb-8">
          <span className="font-display text-2xl font-bold text-gradient">CollabKaro</span>
        </Link>

        <div className="glass rounded-2xl p-8 glow-amber">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(245, 158, 11, 0.15)' }}
          >
            <Clock size={28} style={{ color: 'var(--brand-accent)' }} />
          </div>

          <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {name ? `Thanks, ${name}!` : 'Account created!'}
          </h1>

          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your influencer profile is under review. Our team checks every new
            profile before activating it, this usually takes a day or two.
            We'll notify you the moment you're approved.
          </p>

          <div
            className="flex items-center gap-2 justify-center text-sm mb-4 px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <Sparkles size={16} style={{ color: 'var(--brand-accent)' }} />
            Once approved, brands will be able to discover your profile and send you gigs.
          </div>

          <div style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 14, background: 'rgba(29,78,216,0.06)', border: '1.5px solid rgba(29,78,216,0.15)', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0c1445', marginBottom: 8 }}>💰 Payout Schedule</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12.5, color: '#374151', lineHeight: 1.7 }}>
              <li>Earnings released <strong>once a month on the 20th</strong></li>
              <li>All completed collabs from the cycle are bundled into one payout</li>
              <li>Complete <strong>KYC verification</strong> before your first payout</li>
            </ul>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary w-full justify-center">
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </motion.div>
    </main>
  )
}