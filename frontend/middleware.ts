import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes (accessible without auth)
const publicRoutes = ['/', '/login', '/register'];

// Auth routes (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Allow access to public routes
  if (isPublicRoute) {
    // If logged in and trying to access auth pages, redirect to dashboard
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // For all other routes (protected), check authentication
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
