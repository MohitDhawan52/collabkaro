import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/register/influencer', '/register/brand']
  if (publicRoutes.includes(pathname)) {
    return supabaseResponse
  }

  // If not logged in, redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get user profile for role-based routing
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes
  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Brand routes
  if (pathname.startsWith('/brand') && profile.role !== 'brand') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Influencer routes
  if (pathname.startsWith('/influencer') && profile.role !== 'influencer') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Pending approval — brands must wait, influencers can browse (pitch is locked in UI)
  if (profile.status === 'pending' && !pathname.includes('/pending')) {
    if (profile.role === 'brand') return NextResponse.redirect(new URL('/brand/pending', request.url))
    // Influencers: allow dashboard, gigs, profile — only block pitching/earnings/collabs/kyc actions
    if (profile.role === 'influencer') {
      const blockedWhilePending = ['/influencer/pitches', '/influencer/earnings', '/influencer/collabs', '/influencer/kyc']
      if (blockedWhilePending.some(p => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL('/influencer/pending', request.url))
      }
    }
  }

  // Rejected
  if (profile.status === 'rejected' && !pathname.includes('/rejected')) {
    return NextResponse.redirect(new URL('/rejected', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}