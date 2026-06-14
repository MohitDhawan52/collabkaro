'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [agreement, setAgreement] = useState<any>(null)
  const [brand, setBrand] = useState<any>(null)
  const [influencer, setInfluencer] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [userRole, setUserRole] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    setUserRole(profile?.role || '')

    const { data: agr } = await supabase
      .from('agreements').select('*').eq('id', params.id).single()
    if (!agr) { router.push('/'); return }
    setAgreement(agr)

    const { data: brandData } = await supabase
      .from('brand_profiles').select('*').eq('id', agr.brand_id).single()
    setBrand(brandData)

    const { data: infData } = await supabase
      .from('influencer_profiles').select('*').eq('id', agr.influencer_id).single()
    setInfluencer(infData)

    const { data: payData } = await supabase
      .from('payments').select('*').eq('agreement_id', params.id).single()
    setPayment(payData)

    setLoading(false)
  }

  const handlePayment = async () => {
    setPaying(true)

    if (payment) {
      await supabase.from('payments')
        .update({ status: 'held', paid_at: new Date().toISOString() })
        .eq('id', payment.id)
    } else {
      await supabase.from('payments').insert({
        agreement_id: params.id,
        brand_id: agreement.brand_id,
        influencer_id: agreement.influencer_id,
        amount: agreement.amount,
        status: 'held',
        paid_at: new Date().toISOString(),
      })
    }

    await loadData()
    setPaying(false)
  }

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to cancel and request a refund?')) return
    await supabase.from('payments')
      .update({ status: 'refunded' })
      .eq('agreement_id', params.id)
    await supabase.from('agreements')
      .update({ status: 'cancelled' })
      .eq('id', params.id)
    await loadData()
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">💰</div>
        <p style={{ color: '#9ca3af' }}>Loading payment details...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href={userRole === 'brand' ? '/dashboard/brand' : '/dashboard/influencer'}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af' }}>
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold">💰 <span className="gradient-text">Payment</span></h1>
            <p style={{ color: '#9ca3af' }}>Secure escrow payment</p>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold mb-4">🔒 How Escrow Works</h2>
          <div className="flex flex-col gap-3">
            {[
              { step: '1', text: 'Brand pays the full amount to CollabSphere', done: !!payment },
              { step: '2', text: 'CollabSphere holds the payment securely', done: payment?.status === 'held' },
              { step: '3', text: 'Influencer delivers the content', done: agreement?.status === 'completed' },
              { step: '4', text: 'Brand approves & payment is released', done: payment?.status === 'released' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: item.done ? 'linear-gradient(135deg, #6c47ff, #ff47a3)' : '#1e1e2e',
                    border: item.done ? 'none' : '1px solid #2a2a3a',
                    color: item.done ? 'white' : '#6b7280'
                  }}>
                  {item.done ? '✓' : item.step}
                </div>
                <p className="text-sm" style={{ color: item.done ? 'white' : '#6b7280' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Card */}
        <div className="card p-8 mb-6">
          <div className="text-center mb-8">
            <p className="text-sm mb-2" style={{ color: '#9ca3af' }}>Total Amount</p>
            <p className="text-5xl font-bold gradient-text">₹{agreement?.amount?.toLocaleString()}</p>
            <p className="text-sm mt-2" style={{ color: '#9ca3af' }}>
              {agreement?.collab_type} collaboration
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: '#1e1e2e' }}>
              <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>FROM</p>
              <p className="font-semibold">{brand?.brand_name}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#1e1e2e' }}>
              <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>TO</p>
              <p className="font-semibold">{influencer?.full_name}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl mb-6" style={{ background: '#1e1e2e' }}>
            <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>DELIVERABLES</p>
            <div className="flex flex-wrap gap-2">
              {agreement?.deliverables?.map((d: string) => (
                <span key={d} className="px-3 py-1 rounded-full text-xs"
                  style={{ background: 'rgba(108,71,255,0.15)', color: '#8b6dff' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          {payment && (
            <div className="p-4 rounded-xl mb-6 text-center" style={{
              background: payment.status === 'held' ? 'rgba(234,179,8,0.1)' :
                payment.status === 'released' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${payment.status === 'held' ? '#eab308' :
                payment.status === 'released' ? '#10b981' : '#ef4444'}`
            }}>
              <p className="font-bold" style={{
                color: payment.status === 'held' ? '#eab308' :
                  payment.status === 'released' ? '#10b981' : '#ef4444'
              }}>
                {payment.status === 'held' && '🔒 Payment Held in Escrow'}
                {payment.status === 'released' && '✅ Payment Released to Influencer'}
                {payment.status === 'refunded' && '↩️ Payment Refunded to Brand'}
              </p>
              {payment.paid_at && (
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  Paid on {new Date(payment.paid_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Actions for Brand */}
          {userRole === 'brand' && (
            <div className="flex flex-col gap-3">
              {!payment || payment.status === 'refunded' ? (
                <button onClick={handlePayment} disabled={paying}
                  className="w-full py-4 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-all text-lg">
                  {paying ? 'Processing...' : '💳 Pay ₹' + agreement?.amount?.toLocaleString() + ' (Escrow)'}
                </button>
              ) : payment.status === 'held' ? (
                <>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
                    <p className="text-sm" style={{ color: '#eab308' }}>
                      ⏳ Waiting for influencer to deliver content. Once done, go to the agreement page to approve and release payment.
                    </p>
                  </div>
                  <Link href={`/agreements/${params.id}`}
                    className="w-full py-3 rounded-xl text-white font-semibold text-center transition-all"
                    style={{ background: '#10b981' }}>
                    ✅ Approve Delivery & Release Payment
                  </Link>
                  <button onClick={handleRefund}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: '#1e1e2e', border: '1px solid #ef4444', color: '#ef4444' }}>
                    ↩️ Cancel & Request Refund
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Info for Influencer */}
          {userRole === 'influencer' && (
            <div className="p-4 rounded-xl text-center" style={{
              background: 'rgba(108,71,255,0.1)',
              border: '1px solid rgba(108,71,255,0.3)'
            }}>
              <p className="text-sm" style={{ color: '#8b6dff' }}>
                {!payment
                  ? '⏳ Waiting for brand to make payment before work begins.'
                  : payment.status === 'held'
                    ? '✅ Payment is secured in escrow. Deliver your content and the brand will release payment.'
                    : payment.status === 'released'
                      ? '🎉 Payment has been released to you!'
                      : '↩️ This collaboration was cancelled and payment was refunded.'}
              </p>
            </div>
          )}
        </div>

        {/* Protection Notice */}
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            🛡️ <strong style={{ color: 'white' }}>CollabSphere Protection:</strong> Your payment is held securely.
            If the collaboration fails, the brand receives a full refund. Both parties are protected.
          </p>
        </div>
      </div>
    </main>
  )
}