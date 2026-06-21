'use client'

import jsPDF from 'jspdf'

interface ContractData {
  gigTitle: string
  description?: string | null
  deliverables: string
  timeline?: string | null
  collabType: 'paid' | 'barter'
  agreedAmount: number | null
  brandName: string
  influencerName: string
  instagramHandle?: string | null
  brandSignedAt: string | null
  influencerSignedAt: string | null
  createdAt: string
}

function formatINR(amount: number | null | undefined): string {
  if (!amount) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Pending'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function generateContract(data: ContractData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 20
  const CONTENT_W = W - MARGIN * 2
  let y = 0

  // ── Helpers ──────────────────────────────────────────────────────────────
  const line = (x1: number, y1: number, x2: number, y2: number, color = '#e5e7eb') => {
    doc.setDrawColor(color)
    doc.line(x1, y1, x2, y2)
  }

  const text = (str: string, x: number, yPos: number, opts?: { align?: 'left' | 'center' | 'right'; color?: string; size?: number; bold?: boolean }) => {
    doc.setFontSize(opts?.size ?? 10)
    doc.setTextColor(opts?.color ?? '#111827')
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    doc.text(str, x, yPos, { align: opts?.align ?? 'left' })
  }

  const wrappedText = (str: string, x: number, yPos: number, maxW: number, opts?: { size?: number; color?: string; bold?: boolean }): number => {
    doc.setFontSize(opts?.size ?? 10)
    doc.setTextColor(opts?.color ?? '#374151')
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(str, maxW)
    doc.text(lines, x, yPos)
    return yPos + lines.length * (opts?.size ?? 10) * 0.4
  }

  const section = (title: string, yPos: number): number => {
    doc.setFillColor('#1d4ed8')
    doc.roundedRect(MARGIN, yPos, CONTENT_W, 7, 1, 1, 'F')
    text(title, MARGIN + 4, yPos + 5, { color: '#ffffff', size: 9, bold: true })
    return yPos + 12
  }

  const field = (label: string, value: string, yPos: number, multiline = false): number => {
    text(label + ':', MARGIN, yPos, { color: '#6b7280', size: 9, bold: true })
    if (multiline) {
      const nextY = wrappedText(value, MARGIN + 45, yPos, CONTENT_W - 45, { size: 9, color: '#111827' })
      return Math.max(nextY + 3, yPos + 6)
    }
    text(value, MARGIN + 45, yPos, { color: '#111827', size: 9 })
    return yPos + 6
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  y = 15
  // Blue gradient bar
  doc.setFillColor('#1d4ed8')
  doc.rect(0, 0, W, 28, 'F')
  doc.setFillColor('#06b6d4')
  doc.rect(W * 0.6, 0, W * 0.4, 28, 'F')

  text('✦  CollabKaro', MARGIN, 11, { color: '#ffffff', size: 16, bold: true })
  text('India\'s Influencer Marketing Platform', MARGIN, 18, { color: 'rgba(255,255,255,0.8)', size: 9 })
  text('collabkaro.in', W - MARGIN, 11, { color: '#ffffff', size: 9, align: 'right' })

  // ── TITLE ─────────────────────────────────────────────────────────────────
  y = 36
  text('INFLUENCER COLLABORATION AGREEMENT', W / 2, y, { color: '#0c1445', size: 13, bold: true, align: 'center' })
  y += 5
  text(`Generated on ${formatDate(data.createdAt)}`, W / 2, y, { color: '#9ca3af', size: 8, align: 'center' })
  y += 8
  line(MARGIN, y, W - MARGIN, y)
  y += 8

  // ── PARTIES ───────────────────────────────────────────────────────────────
  y = section('1. PARTIES', y)
  y = field('Brand', data.brandName.toUpperCase(), y)
  y = field('Influencer', data.influencerName + (data.instagramHandle ? ` (@${data.instagramHandle})` : ''), y)
  y += 4

  // ── CAMPAIGN DETAILS ──────────────────────────────────────────────────────
  y = section('2. CAMPAIGN DETAILS', y)
  y = field('Gig Title', data.gigTitle, y)
  y = field('Collaboration Type', data.collabType === 'barter' ? 'Product Barter (No monetary payment)' : 'Paid Collaboration', y)
  if (data.collabType === 'paid') {
    y = field('Agreed Amount', formatINR(data.agreedAmount), y)
    y = field('Platform Fee', '10% commission deducted by CollabKaro', y)
  }
  if (data.timeline) y = field('Timeline', data.timeline, y)
  y += 4

  // ── DELIVERABLES ──────────────────────────────────────────────────────────
  y = section('3. DELIVERABLES & SCOPE', y)
  y = field('Deliverables', data.deliverables, y, true)
  y += 4

  // ── TERMS ─────────────────────────────────────────────────────────────────
  y = section('4. TERMS & CONDITIONS', y)
  const terms = [
    '1. The Influencer agrees to create and publish the agreed deliverables within the specified timeline.',
    '2. Content must comply with ASCI guidelines and clearly disclose the paid/barter partnership.',
    '3. The Brand retains the right to request one round of reasonable revisions.',
    '4. All content created remains the intellectual property of the Influencer unless otherwise agreed.',
    '5. The Brand shall not use the Influencer\'s name, image, or content beyond the agreed scope without permission.',
    '6. CollabKaro acts solely as a platform facilitator and is not a party to this agreement.',
    '7. Any disputes shall be resolved through CollabKaro\'s dispute resolution process.',
    '8. This agreement is governed by the laws of India.',
  ]
  for (const t of terms) {
    y = wrappedText(t, MARGIN, y, CONTENT_W, { size: 8.5, color: '#374151' })
    y += 2
  }
  y += 4

  // ── SIGNATURES ────────────────────────────────────────────────────────────
  // Check if we need a new page
  if (y > 240) { doc.addPage(); y = 20 }

  y = section('5. DIGITAL SIGNATURES', y)

  // Brand signature box
  const boxH = 32
  doc.setDrawColor('#d1d5db')
  doc.setFillColor('#f9fafb')
  doc.roundedRect(MARGIN, y, (CONTENT_W / 2) - 4, boxH, 2, 2, 'FD')
  text('BRAND', MARGIN + 4, y + 7, { color: '#6b7280', size: 8, bold: true })
  text(data.brandName, MARGIN + 4, y + 14, { color: '#0c1445', size: 10, bold: true })
  text('Signed on:', MARGIN + 4, y + 21, { color: '#6b7280', size: 8 })
  text(formatDate(data.brandSignedAt), MARGIN + 4, y + 27, { color: '#059669', size: 8, bold: true })

  // Influencer signature box
  const bx = MARGIN + (CONTENT_W / 2) + 4
  doc.setDrawColor('#d1d5db')
  doc.setFillColor('#f9fafb')
  doc.roundedRect(bx, y, (CONTENT_W / 2) - 4, boxH, 2, 2, 'FD')
  text('INFLUENCER', bx + 4, y + 7, { color: '#6b7280', size: 8, bold: true })
  text(data.influencerName, bx + 4, y + 14, { color: '#0c1445', size: 10, bold: true })
  text('Signed on:', bx + 4, y + 21, { color: '#6b7280', size: 8 })
  text(formatDate(data.influencerSignedAt), bx + 4, y + 27, { color: '#059669', size: 8, bold: true })

  y += boxH + 8

  // CollabKaro facilitated note
  doc.setFillColor('#eff6ff')
  doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, 'F')
  text('✦ This agreement was facilitated by CollabKaro — India\'s Influencer Marketing Platform (collabkaro.in)', W / 2, y + 6.5, { color: '#1d4ed8', size: 8, align: 'center' })
  y += 14

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const pageH = doc.internal.pageSize.getHeight()
    line(MARGIN, pageH - 12, W - MARGIN, pageH - 12, '#e5e7eb')
    text(`CollabKaro — Influencer Collaboration Agreement  ·  Page ${p} of ${totalPages}`, W / 2, pageH - 6, { color: '#9ca3af', size: 7.5, align: 'center' })
  }

  const filename = `CollabKaro_Agreement_${data.brandName.replace(/\s+/g, '_')}_${data.influencerName.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
