import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error || !code || !userId) {
    return NextResponse.redirect(`${appUrl}/influencer/profile?ig_error=1`)
  }

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = `${appUrl}/api/instagram/callback`

  // Exchange code for short-lived token
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/influencer/profile?ig_error=1`)
  }

  // Fetch Instagram profile
  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,followers_count,biography,profile_picture_url&access_token=${tokenData.access_token}`
  )
  const profile = await profileRes.json()

  // Save to influencer_profiles
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase.from('influencer_profiles').update({
    instagram_handle: profile.username ?? null,
    instagram_followers: profile.followers_count ?? null,
    instagram_user_id: profile.id ?? null,
    instagram_verified: true,
  }).eq('user_id', userId)

  return NextResponse.redirect(`${appUrl}/influencer/profile?ig_connected=1`)
}
