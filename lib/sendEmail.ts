'use client'

export async function sendEmail(userId: string, subject: string, html: string) {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subject, html }),
    })
  } catch (e) {
    console.error('[sendEmail] failed:', e)
  }
}
