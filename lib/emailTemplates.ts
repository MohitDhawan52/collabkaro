const BASE = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#f8fafc;padding:0 0 32px;">
    <div style="background:linear-gradient(135deg,#1d4ed8,#06b6d4);padding:28px 32px;border-radius:0 0 0 0;">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">✦ CollabKaro</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">India's Influencer Marketing Platform</div>
    </div>
    <div style="background:#fff;padding:32px;margin:0;border-radius:0 0 16px 16px;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
      {{BODY}}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:center;">
        You received this because you have an account on CollabKaro.<br/>
        <a href="https://collabkaro.in" style="color:#1d4ed8;text-decoration:none;">collabkaro.in</a>
      </div>
    </div>
  </div>
`

function wrap(body: string) {
  return BASE.replace('{{BODY}}', body)
}

function btn(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#1d4ed8,#06b6d4);color:#fff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;">${label}</a>`
}

function heading(text: string) {
  return `<div style="font-size:22px;font-weight:800;color:#0c1445;margin-bottom:8px;">${text}</div>`
}

function sub(text: string) {
  return `<div style="font-size:14px;color:#64748b;margin-bottom:20px;line-height:1.6;">${text}</div>`
}

function card(content: string) {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:16px 0;font-size:13.5px;color:#374151;line-height:1.7;">${content}</div>`
}

// ── Templates ────────────────────────────────────────────────────────────────

export function pitchReceivedEmail(brandName: string, influencerName: string, gigTitle: string, message: string) {
  return {
    subject: `New Pitch: ${influencerName} applied to your gig`,
    html: wrap(`
      ${heading(`You have a new pitch! 🎉`)}
      ${sub(`<strong>${influencerName}</strong> has pitched for your gig on CollabKaro.`)}
      ${card(`<strong>Gig:</strong> ${gigTitle}<br/><strong>Influencer:</strong> ${influencerName}<br/><strong>Message:</strong> "${message}"`)}
      <div style="font-size:13.5px;color:#374151;">Log in to your CollabKaro dashboard to review the pitch, check their profile, and accept or decline.</div>
      ${btn('Review Pitch →', 'https://collabkaro.in/brand/pitches')}
    `),
  }
}

export function pitchAcceptedEmail(influencerName: string, brandName: string, gigTitle: string) {
  return {
    subject: `Your pitch was accepted! 🎉 — ${gigTitle}`,
    html: wrap(`
      ${heading(`Congratulations! Your pitch was accepted 🎊`)}
      ${sub(`<strong>${brandName}</strong> has accepted your pitch on CollabKaro.`)}
      ${card(`<strong>Gig:</strong> ${gigTitle}<br/><strong>Brand:</strong> ${brandName}<br/><strong>Next step:</strong> Sign the collaboration agreement`)}
      <div style="font-size:13.5px;color:#374151;">Head to your Collaborations page to sign the agreement and get started!</div>
      ${btn('View Collaboration →', 'https://collabkaro.in/influencer/collabs')}
    `),
  }
}

export function inviteSentEmail(influencerName: string, brandName: string, gigTitle: string) {
  return {
    subject: `${brandName} invited you to collaborate!`,
    html: wrap(`
      ${heading(`You've been invited! ✨`)}
      ${sub(`<strong>${brandName}</strong> wants to work with you on CollabKaro.`)}
      ${card(`<strong>Gig:</strong> ${gigTitle}<br/><strong>Brand:</strong> ${brandName}<br/><strong>Next step:</strong> Review the invite and send your pitch`)}
      <div style="font-size:13.5px;color:#374151;">This brand specifically chose you. Log in to review the gig details and respond with your pitch!</div>
      ${btn('View Invite →', 'https://collabkaro.in/influencer/gigs')}
    `),
  }
}

export function inviteAcceptedEmail(brandName: string, influencerName: string, gigTitle: string) {
  return {
    subject: `${influencerName} responded to your invite`,
    html: wrap(`
      ${heading(`Great news! Influencer responded 🙌`)}
      ${sub(`<strong>${influencerName}</strong> has responded to your invite on CollabKaro.`)}
      ${card(`<strong>Gig:</strong> ${gigTitle}<br/><strong>Influencer:</strong> ${influencerName}<br/><strong>Next step:</strong> Review their pitch and accept to start the collab`)}
      ${btn('Review Pitch →', 'https://collabkaro.in/brand/pitches')}
    `),
  }
}

export function influencerSignedEmail(brandName: string, influencerName: string, gigTitle: string) {
  return {
    subject: `Agreement signed by ${influencerName} — your turn!`,
    html: wrap(`
      ${heading(`Influencer signed the agreement ✍️`)}
      ${sub(`<strong>${influencerName}</strong> has signed the collaboration agreement. Now it's your turn to sign.`)}
      ${card(`<strong>Gig:</strong> ${gigTitle}<br/><strong>Influencer:</strong> ${influencerName}<br/><strong>Action needed:</strong> Sign the agreement to activate this collaboration`)}
      <div style="font-size:13.5px;color:#374151;">Once you sign, the collaboration becomes active and ${influencerName} can start working on deliverables.</div>
      ${btn('Sign Agreement →', 'https://collabkaro.in/brand/collabs')}
    `),
  }
}

export function brandSignedEmail(influencerName: string, brandName: string, gigTitle: string) {
  return {
    subject: `Agreement fully signed — collaboration is LIVE! 🚀`,
    html: wrap(`
      ${heading(`Your collaboration is now LIVE! 🚀`)}
      ${sub(`Both you and <strong>${brandName}</strong> have signed the agreement. The collaboration is officially active!`)}
      ${card(`<strong>Gig:</strong> ${gigTitle}<br/><strong>Brand:</strong> ${brandName}<br/><strong>Next step:</strong> Start working on deliverables and submit the link when done`)}
      <div style="font-size:13.5px;color:#374151;">Complete the deliverables and submit your work from the Collaborations page. Good luck! 🎯</div>
      ${btn('View Collaboration →', 'https://collabkaro.in/influencer/collabs')}
    `),
  }
}

export function newMessageEmail(recipientName: string, senderName: string, gigTitle: string, preview: string) {
  return {
    subject: `New message from ${senderName} on "${gigTitle}"`,
    html: wrap(`
      ${heading(`You have a new message 💬`)}
      ${sub(`<strong>${senderName}</strong> sent you a message about your collaboration.`)}
      ${card(`<strong>Collab:</strong> ${gigTitle}<br/><strong>Message preview:</strong> "${preview.slice(0, 120)}${preview.length > 120 ? '…' : ''}"`)}
      <div style="font-size:13.5px;color:#374151;">Reply directly from your CollabKaro dashboard.</div>
      ${btn('Open Chat →', 'https://collabkaro.in')}
    `),
  }
}
