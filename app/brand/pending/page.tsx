'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, LogOut, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function BrandPendingPage() {
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

      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('brand_name')
        .eq('user_id', user.id)
        .single()

      setName(brand?.brand_name ?? null)
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

        <div className="glass rounded-2xl p-8 glow-purple">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(124, 58, 237, 0.15)' }}
          >
            <Clock size={28} style={{ color: 'var(--brand-primary)' }} />
          </div>

          <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {name ? `Thanks, ${name}!` : 'Account created!'}
          </h1>

          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your brand profile is under review. Our team verifies every new
            brand before activating it — this usually takes a day or two.
            We'll email you the moment you're approved.
          </p>

          <div
            className="flex items-center gap-2 justify-center text-sm mb-6 px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <Briefcase size={16} style={{ color: 'var(--brand-primary)' }} />
            Once approved, you'll be able to post gigs and discover influencers.
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