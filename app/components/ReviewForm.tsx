'use client'

import { useEffect, useState } from 'react'
import { Star, Send, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface Props {
  collabId: string
  myRole: 'brand' | 'influencer'
  revieweeId: string   // auth user_id of the person being reviewed
  revieweeName: string
}

export default function ReviewForm({ collabId, myRole, revieweeId, revieweeName }: Props) {
  const [existing, setExisting] = useState<{ rating: number; comment: string | null } | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('reviews')
        .select('rating, comment')
        .eq('collab_id', collabId)
        .eq('reviewer_role', myRole)
        .single()
      if (data) {
        setExisting(data)
        setRating(data.rating)
        setComment(data.comment ?? '')
        setSubmitted(true)
      }
    }
    load()
  }, [collabId, myRole])

  async function submit() {
    if (!rating || !userId) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').upsert({
      collab_id: collabId,
      reviewer_id: userId,
      reviewer_role: myRole,
      reviewee_id: revieweeId,
      reviewee_role: myRole === 'brand' ? 'influencer' : 'brand',
      rating,
      comment: comment.trim() || null,
    }, { onConflict: 'collab_id,reviewer_role' })

    if (error) {
      toast.error('Could not submit review')
    } else {
      toast.success('Review submitted!')
      setExisting({ rating, comment: comment.trim() || null })
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  const stars = [1, 2, 3, 4, 5]
  const activeRating = hover || rating

  const LABELS: Record<number, string> = {
    1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent'
  }

  return (
    <div style={{
      marginTop: 14,
      padding: '14px 16px',
      background: submitted ? 'rgba(16,185,129,0.05)' : 'rgba(29,78,216,0.04)',
      border: submitted ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(29,78,216,0.1)',
      borderRadius: 14,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Star size={13} style={{ color: '#f59e0b' }} />
        {submitted ? `Your review for ${revieweeName}` : `Rate ${revieweeName}`}
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: submitted ? 6 : 10 }}>
        {stars.map(s => (
          <button
            key={s}
            onClick={() => !submitted && setRating(s)}
            onMouseEnter={() => !submitted && setHover(s)}
            onMouseLeave={() => !submitted && setHover(0)}
            style={{
              background: 'none', border: 'none', padding: 2,
              cursor: submitted ? 'default' : 'pointer',
              color: s <= activeRating ? '#f59e0b' : '#d1d5db',
              transition: 'color 0.1s, transform 0.1s',
              transform: !submitted && hover === s ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            <Star size={22} fill={s <= activeRating ? '#f59e0b' : 'none'} />
          </button>
        ))}
        {activeRating > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginLeft: 4 }}>
            {LABELS[activeRating]}
          </span>
        )}
      </div>

      {submitted && existing ? (
        <div>
          {existing.comment && (
            <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{existing.comment}"
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#10b981', marginTop: 6, fontWeight: 600 }}>
            <CheckCircle2 size={12} /> Review submitted
          </div>
        </div>
      ) : (
        <>
          <textarea
            placeholder="Write a comment (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.8)',
              fontSize: 12.5, resize: 'none', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
            }}
          />
          <button
            onClick={submit}
            disabled={!rating || submitting}
            style={{
              marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 10, border: 'none',
              background: rating ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'rgba(0,0,0,0.07)',
              color: rating ? '#fff' : '#9ca3af',
              fontWeight: 700, fontSize: 12.5, cursor: rating ? 'pointer' : 'default',
              boxShadow: rating ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Send size={12} /> {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </>
      )}
    </div>
  )
}
