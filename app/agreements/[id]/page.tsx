'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AgreementPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [agreement, setAgreement] = useState<any>(null)
  const [brand, setBrand] = useState<any>(null)
  const [influencer, setInfluencer] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }

      const user = session.user

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      setUserRole(profile?.role || '')

      const { data: agr, error: agrError } = await supabase
        .from('agreements').select('*').eq('id', params.id).single()
      
      if (agrError || !agr) { 
        setError('Agreement not found')
        setLoading(false)
        return 
      }
      setAgreement(agr)

      const { data: brandData } = await supabase
        .from('brand_profiles').select('*').eq('id', agr.brand_id).single()
      setBrand(brandData)

      const { data: infData } = await supabase
        .from('influencer_profiles').select('*').eq('id', agr.influencer_id).single()
      setInfluencer(infData)

      setLoading(false)
    } catch (err) {
      setError('Something went wrong. Please refresh.')
      setLoading(false)
    }
  }

  const handleSign = async () => {
    setSigning(true)
    try {
      const updateData: any = userRole === 'brand'
        ? { signed_by_brand: true }
        : { signed_by_influencer: true }

      const willBeFullySigned = 
        (userRole === 'brand' && agreement.signed_by_influencer) ||
        (userRole === 'influencer' && agreement.signed_by_brand)

      if (willBeFullySigned) updateData.status = 'signed'

      await supabase.from('agreements').update(updateData).eq('id', params.id)

      if (willBeFullySigned && agreement.collab_type !== 'barter') {
        window.location.href = `/payments/${params.id}`
      } else {
        await loadData()
      }
    } catch (err) {
      setError('Failed to sign. Please try again.')
    }
    setSigning(false)
  }

  const handleComplete = async () => {
    await supabase.from('agreements').update({ status: 'completed' }).eq('id', params.id)
    await supabase.from('payments')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('agreement_id', params.id)
    await loadData()
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">📄</div>
        <p style={{ color: '#9ca3af' }}>Loading agreement...</p>
      </div>
    </main>
  )

  if (error) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={() => window.location.href = '/'} className="mt-4 px-6 py-2 rounded-xl text-white gradient-bg">
          Go Home
        </button>
      </div>
    </main>
  )

  const alreadySigned = userRole === 'brand' ? agreement?.signed_by_brand : agreement?.signed_by_influencer

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link href={userRole === 'brand' ? '/dashboard/brand' : '/dashboard/influencer'}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
            ← Dashboard
          </Link>
          <span className="px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: agreement?.status === 'signed' ? 'rgba(16,185,129,0.15)' :
                agreement?.status === 'completed' ? 'rgba(108,71,255,0.15)' : 'rgba(234,179,8,0.15)',
              color: agreement?.status === 'signed' ? '#10b981' :
                agreement?.status === 'completed' ? '#8b6dff' : '#eab308'
            }}>
            {agreement?.status?.toUpperCase()}
          </span>
        </div>

        <div className="card p-10">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📄</div>
            <h1 className="text-3xl font-bold gradient-text">Collaboration Agreement</h1>
            <p className="mt-2 text-sm" style={{ color: '#9ca3af' }}>
              Agreement ID: {params.id.slice(0, 8)}...
            </p>
          </div>

          <div className="p-6 rounded-xl mb-6" style={{ background: '#1e1e2e' }}>
            <h2 className="font-bold mb-4 text-lg">Parties</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>BRAND</p>
                <p className="font-semibold">{brand?.brand_name}</p>
                <p className="text-sm" style={{ color: '#9ca3af' }}>{brand?.website}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>INFLUENCER</p>
                <p className="font-semibold">{influencer?.full_name}</p>
                <p className="text-sm" style={{ color: '#9ca3af' }}>{influencer?.instagram_handle}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl mb-6" style={{ background: '#1e1e2e' }}>
            <h2 className="font-bold mb-4 text-lg">Collaboration Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>TYPE</p>
                <p className="font-semibold capitalize">{agreement?.collab_type}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>AMOUNT</p>
                <p className="font-semibold text-green-400">
                  {agreement?.amount ? `₹${agreement.amount.toLocaleString()}` : 'Barter'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>DELIVERABLES</p>
              <div className="flex flex-wrap gap-2">
                {agreement?.deliverables?.map((d: string) => (
                  <span key={d} className="px-3 py-1 rounded-full text-sm"
                    style={{ background: 'rgba(108,71,255,0.15)', color: '#8b6dff' }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl mb-8" style={{ background: '#1e1e2e' }}>
            <h2 className="font-bold mb-4 text-lg">Terms & Conditions</h2>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#9ca3af' }}>
              {agreement?.terms}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl text-center" style={{
              background: agreement?.signed_by_brand ? 'rgba(16,185,129,0.1)' : '#1e1e2e',
              border: `1px solid ${agreement?.signed_by_brand ? '#10b981' : '#2a2a3a'}`
            }}>
              <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>BRAND SIGNATURE</p>
              {agreement?.signed_by_brand
                ? <p className="text-green-400 font-semibold">✅ Signed</p>
                : <p style={{ color: '#6b7280' }}>⏳ Pending</p>}
            </div>
            <div className="p-4 rounded-xl text-center" style={{
              background: agreement?.signed_by_influencer ? 'rgba(16,185,129,0.1)' : '#1e1e2e',
              border: `1px solid ${agreement?.signed_by_influencer ? '#10b981' : '#2a2a3a'}`
            }}>
              <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>INFLUENCER SIGNATURE</p>
              {agreement?.signed_by_influencer
                ? <p className="text-green-400 font-semibold">✅ Signed</p>
                : <p style={{ color: '#6b7280' }}>⏳ Pending</p>}
            </div>
          </div>

          {agreement?.status !== 'completed' && !alreadySigned && (
            <button onClick={handleSign} disabled={signing}
              className="w-full py-4 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all text-lg mb-3">
              {signing ? 'Signing...' : '✍️ Sign Agreement'}
            </button>
          )}

          {alreadySigned && agreement?.status === 'draft' && (
            <div className="p-4 rounded-xl text-center mb-3" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <p style={{ color: '#eab308' }}>✅ You signed. Waiting for the other party to sign.</p>
            </div>
          )}

          {agreement?.status === 'signed' && userRole === 'brand' && (
            <button onClick={handleComplete}
              className="w-full py-4 rounded-xl text-white font-semibold transition-all text-lg"
              style={{ background: '#10b981' }}>
              ✅ Mark Completed & Release Payment
            </button>
          )}

          {agreement?.status === 'completed' && (
            <div className="text-center p-6 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981' }}>
              <p className="text-green-400 font-bold text-lg">🎉 Collaboration Completed!</p>
              <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>Payment has been released to the influencer.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}