import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const protectedPaths = ['/dashboard', '/onboarding', '/gigs', '/discover', '/agreements', '/payments']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('sb-diazxjpsnxzkastmvvhg-auth-token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}