'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, User, MapPin, Building2, Globe,
  Phone, ArrowRight, ArrowLeft, Loader2, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const INDUSTRIES = [
  'Fashion & Apparel',
  'Beauty & Cosmetics',
  'Food & Beverage',
  'Health & Fitness',
  'Travel & Hospitality',
  'Technology',
  'Finance & Fintech',
  'Education',
  'E-commerce',
  'Real Estate',
  'Entertainment & Media',
  'Other',
]

interface FormState {
  email: string
  password: string
  confirmPassword: string
  company_name: string
  industry: string
  location: string
  description: string
  website: string
  contact_name: string
  phone: string
  terms_accepted: boolean
}

const STEPS = ['Account', 'Company profile', 'Contact & terms']

export default function BrandRegisterPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    industry: '',
    location: '',
    description: '',
    website: '',
    contact_name: '',
    phone: '',
    terms_accepted: false,
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.email || !form.password || !form.confirmPassword) {
        toast.error('Please fill in all fields')
        return false
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return false
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }
    }
    if (step === 1) {
      if (!form.company_name || !form.industry || !form.location || !form.description) {
        toast.error('Please fill in all required fields')
        return false
      }
    }
    if (step === 2) {
      if (!form.contact_name || !form.phone) {
        toast.error('Please add a contact name and phone number')
        return false
      }
      if (!form.terms_accepted) {
        toast.error('Please accept the terms to continue')
        return false
      }
    }
    return true
  }

  function goNext() {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setLoading(true)

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: 'brand' } },
    })

    if (signUpError) {
      setLoading(false)
      toast.error(signUpError.message)
      return
    }

    if (!data.user) {
      setLoading(false)
      toast.error('Something went wrong creating your account')
      return
    }

    if (!data.session) {
      setLoading(false)
      toast.success('Account created! Check your email to confirm, then log in.')
      window.location.href = '/login'
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { id: data.user.id, email: form.email, role: 'brand', status: 'pending' },
        { onConflict: 'id' }
      )

    if (profileError) {
      setLoading(false)
      toast.error(`Profile setup failed: ${profileError.message}`)
      return
    }

    const { error: brandError } = await supabase.from('brand_profiles').insert({
      user_id: data.user.id,
      company_name: form.company_name,
      industry: form.industry,
      location: form.location,
      description: form.description,
      website: form.website || null,
      contact_name: form.contact_name,
      phone: form.phone,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    })

    setLoading(false)

    if (brandError) {
      toast.error(`Profile failed: ${brandError.message}`)
      return
    }

    toast.success('Welcome to CollabKaro!')
    window.location.href = '/brand/pending'
  }

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        <Link href="/" className="flex justify-center mb-8">
          <span className="font-display text-3xl font-bold text-gradient tracking-tight">CollabKaro</span>
        </Link>

        <div className="glass rounded-3xl overflow-hidden">
          {/* Header strip */}
          <div className="px-10 pt-9 pb-7 border-b" style={{ borderColor: 'var(--bg-border)' }}>
            <h1 className="font-display text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Set up your brand
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Find and collaborate with the right influencers
            </p>
          </div>

          <div className="px-10 py-8">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div
                    className="step-bar mb-2"
                    style={{
                      background: i <= step ? 'var(--brand-primary)' : 'var(--bg-border)',
                    }}
                  />
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <StepHeader title="Create your account" sub="This is what you'll use to log in" />
                  <Field icon={Mail} label="Email">
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@company.com" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>
                  <Field icon={Lock} label="Password">
                    <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 6 characters" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>
                  <Field icon={Lock} label="Confirm password">
                    <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Re-enter your password" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <StepHeader title="Tell us about your company" sub="Influencers will see this on your brand profile" />
                  <Field icon={Building2} label="Company name">
                    <input type="text" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} placeholder="Your company's name" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Industry</label>
                    <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className="input">
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <Field icon={MapPin} label="Location">
                    <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Mumbai, India" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>

                  <Field icon={Globe} label="Website (optional)">
                    <input type="text" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://yourcompany.com" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                    <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What does your company do, and what kind of campaigns are you looking to run?" rows={3} className="input" style={{ resize: 'none', paddingTop: '11px' }} />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <StepHeader title="Contact details" sub="Who should influencers and our team reach out to?" />
                  <Field icon={User} label="Contact person">
                    <input type="text" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} placeholder="Full name" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>
                  <Field icon={Phone} label="Phone number">
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" className="input" style={{ paddingLeft: '42px' }} />
                  </Field>

                  <label className="flex items-start gap-3 mt-2 cursor-pointer">
                    <span
                      onClick={() => update('terms_accepted', !form.terms_accepted)}
                      className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: form.terms_accepted ? 'var(--brand-primary)' : '#FFFFFF',
                        border: '1.5px solid var(--bg-border)',
                      }}
                    >
                      {form.terms_accepted && <Check size={13} color="white" />}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      I agree to CollabKaro's Terms of Service and Privacy Policy, and confirm the information provided is accurate.
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={goBack} className="btn btn-secondary" disabled={loading}>
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={goNext} className="btn btn-primary flex-1 justify-center">
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary flex-1 justify-center">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                    : <>Create account <ArrowRight size={16} /></>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--brand-primary)' }}>Log in</Link>
        </p>
      </motion.div>
    </div>
  )
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-1">
      <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)', zIndex: 1 }}
        />
        {children}
      </div>
    </div>
  )
}