'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, AlertTriangle, FileText, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected'

interface KYCDoc {
  id: string
  pan_number: string | null
  pan_image_url: string | null
  aadhaar_number: string | null
  aadhaar_front_url: string | null
  aadhaar_back_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  submitted_at: string
}

function StatusBanner({ status, reason }: { status: KYCStatus; reason?: string | null }) {
  if (status === 'approved') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))', border: '1.5px solid rgba(16,185,129,0.3)', marginBottom: 24 }}>
      <CheckCircle2 size={22} style={{ color: '#10b981', flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#065f46' }}>KYC Verified ✓</div>
        <div style={{ fontSize: 13, color: '#059669', marginTop: 2 }}>Your identity has been verified. You are eligible to receive payouts.</div>
      </div>
    </div>
  )
  if (status === 'pending') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 16, background: 'rgba(249,115,22,0.07)', border: '1.5px solid rgba(249,115,22,0.3)', marginBottom: 24 }}>
      <Clock size={22} style={{ color: '#ea580c', flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#9a3412' }}>KYC Under Review</div>
        <div style={{ fontSize: 13, color: '#ea580c', marginTop: 2 }}>Your documents are being verified. This usually takes 1–2 business days.</div>
      </div>
    </div>
  )
  if (status === 'rejected') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 16, background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.25)', marginBottom: 24 }}>
      <XCircle size={22} style={{ color: '#dc2626', flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#7f1d1d' }}>KYC Rejected</div>
        {reason && <div style={{ fontSize: 13, color: '#dc2626', marginTop: 2 }}>Reason: {reason}</div>}
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Please re-submit with correct documents below.</div>
      </div>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 16, background: 'rgba(29,78,216,0.06)', border: '1.5px solid rgba(29,78,216,0.15)', marginBottom: 24 }}>
      <AlertTriangle size={22} style={{ color: '#1d4ed8', flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>KYC Required for Payouts</div>
        <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 2 }}>Submit your PAN and Aadhaar to receive earnings. Required by law in India.</div>
      </div>
    </div>
  )
}

export default function KYCPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kycStatus, setKycStatus] = useState<KYCStatus>('not_submitted')
  const [existing, setExisting] = useState<KYCDoc | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [panNumber, setPanNumber] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [panFile, setPanFile] = useState<File | null>(null)
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null)
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null)

  const panRef = useRef<HTMLInputElement>(null)
  const aFrontRef = useRef<HTMLInputElement>(null)
  const aBackRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setExisting(data as KYCDoc)
        setKycStatus(data.status)
        setPanNumber(data.pan_number ?? '')
        setAadhaarNumber(data.aadhaar_number ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function uploadFile(file: File, path: string): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true })
    if (error) { console.error('Upload error:', error); return null }
    const { data } = supabase.storage.from('kyc-documents').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit() {
    if (!panNumber.trim()) { toast.error('PAN number is required'); return }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase())) {
      toast.error('Invalid PAN format (e.g. ABCDE1234F)'); return
    }
    if (!aadhaarNumber.trim()) { toast.error('Aadhaar number is required'); return }
    if (!/^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''))) {
      toast.error('Aadhaar must be 12 digits'); return
    }
    if (!existing && !panFile) { toast.error('Please upload PAN card image'); return }
    if (!existing && !aadhaarFrontFile) { toast.error('Please upload Aadhaar front image'); return }

    setSubmitting(true)
    const supabase = createClient()

    let panUrl = existing?.pan_image_url ?? null
    let aFrontUrl = existing?.aadhaar_front_url ?? null
    let aBackUrl = existing?.aadhaar_back_url ?? null

    if (panFile) panUrl = await uploadFile(panFile, `${userId}/pan_${Date.now()}`)
    if (aadhaarFrontFile) aFrontUrl = await uploadFile(aadhaarFrontFile, `${userId}/aadhaar_front_${Date.now()}`)
    if (aadhaarBackFile) aBackUrl = await uploadFile(aadhaarBackFile, `${userId}/aadhaar_back_${Date.now()}`)

    const payload = {
      user_id: userId,
      pan_number: panNumber.trim().toUpperCase(),
      pan_image_url: panUrl,
      aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
      aadhaar_front_url: aFrontUrl,
      aadhaar_back_url: aBackUrl,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
    }

    const { error } = existing
      ? await supabase.from('kyc_documents').update(payload).eq('user_id', userId!)
      : await supabase.from('kyc_documents').insert(payload)

    if (error) {
      toast.error('Submission failed: ' + error.message)
    } else {
      toast.success('KYC submitted successfully! We\'ll review within 1–2 business days.')
      setKycStatus('pending')
      setExisting({ ...payload, id: existing?.id ?? '', status: 'pending', rejection_reason: null, submitted_at: new Date().toISOString() } as KYCDoc)
      setPanFile(null); setAadhaarFrontFile(null); setAadhaarBackFile(null)
    }
    setSubmitting(false)
  }

  const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.8)',
    borderRadius: 20, padding: '24px', backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 16px rgba(29,78,216,0.08)', marginBottom: 18,
  }

  const INPUT: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.8)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const LABEL: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block',
  }

  function FileUploadBox({ label, file, onFile, existingUrl, inputRef }: { label: string; file: File | null; onFile: (f: File) => void; existingUrl?: string | null; inputRef: React.RefObject<HTMLInputElement> }) {
    return (
      <div>
        <label style={LABEL}>{label}</label>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed rgba(29,78,216,0.25)', borderRadius: 14,
            padding: '18px 16px', textAlign: 'center', cursor: 'pointer',
            background: file || existingUrl ? 'rgba(29,78,216,0.04)' : 'rgba(255,255,255,0.5)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(29,78,216,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(29,78,216,0.25)')}
        >
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} /> {file.name}
            </div>
          ) : existingUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Already uploaded · click to replace
            </div>
          ) : (
            <div>
              <Upload size={20} style={{ color: '#9ca3af', margin: '0 auto 6px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#6b7280' }}>Click to upload · JPG, PNG, PDF</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Max 5 MB</div>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { if (f.size > 5 * 1024 * 1024) { toast.error('File too large (max 5 MB)'); return } onFile(f) } }} />
      </div>
    )
  }

  if (loading) return (
    <div style={{ maxWidth: 620 }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: 'rgba(255,255,255,0.5)', marginBottom: 16 }} />)}
    </div>
  )

  const isApproved = kycStatus === 'approved'
  const isPending = kycStatus === 'pending'

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0c1445', letterSpacing: -0.4 }}>KYC Verification</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Required to receive earnings payouts in India.</div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <StatusBanner status={kycStatus} reason={existing?.rejection_reason} />
      </div>

      {!isApproved && (
        <>
          {/* PAN Card */}
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(249,115,22,0.1)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={16} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>PAN Card</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={LABEL}>PAN Number *</label>
                <input
                  value={panNumber}
                  onChange={e => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  disabled={isPending}
                  style={{ ...INPUT, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>10-character alphanumeric PAN number</div>
              </div>
              <FileUploadBox label="PAN Card Image *" file={panFile} onFile={setPanFile} existingUrl={existing?.pan_image_url} inputRef={panRef} />
            </div>
          </div>

          {/* Aadhaar */}
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(29,78,216,0.08)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0c1445' }}>Aadhaar Card</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={LABEL}>Aadhaar Number *</label>
                <input
                  value={aadhaarNumber}
                  onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="1234 5678 9012"
                  disabled={isPending}
                  style={{ ...INPUT, letterSpacing: 2, fontWeight: 600 }}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>12-digit Aadhaar number (stored securely, masked in admin)</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FileUploadBox label="Aadhaar Front *" file={aadhaarFrontFile} onFile={setAadhaarFrontFile} existingUrl={existing?.aadhaar_front_url} inputRef={aFrontRef} />
                <FileUploadBox label="Aadhaar Back (optional)" file={aadhaarBackFile} onFile={setAadhaarBackFile} existingUrl={existing?.aadhaar_back_url} inputRef={aBackRef} />
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(29,78,216,0.04)', border: '1px solid rgba(29,78,216,0.1)', fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 18 }}>
            🔒 <strong>Your data is safe.</strong> Documents are stored securely and only accessed by CollabKaro's verification team. Aadhaar numbers are partially masked and never shared with brands.
          </div>

          {!isPending && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)',
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(29,78,216,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <ShieldCheck size={16} />
              {submitting ? 'Submitting…' : (existing ? 'Re-submit KYC Documents' : 'Submit KYC Documents')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
