import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Request ID / Correlation ID
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  
  // Protect dashboard routes - check auth cookie exists
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  const protectedPrefixes = ['/shopkeeper', '/admin', '/orders', '/cart', '/profile'];
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));

  if (isProtected && !token && !pathname.startsWith('/auth')) {
    if (pathname.startsWith('/shopkeeper') || pathname.startsWith('/admin')) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.headers.set('x-request-id', requestId);
      return response;
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: ['/shopkeeper/:path*', '/admin/:path*', '/orders/:path*', '/cart', '/profile', '/api/:path*']
};
