import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-compatible JWT verification HS256 using Web Crypto
async function verifyJWTEdge(token: string, secret: string): Promise<{ userId: string; role: string; exp?: number } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const secretKey = encoder.encode(secret);
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const signature = base64UrlToBytes(signatureB64);
    const valid = await crypto.subtle.verify('HMAC', key, signature as any, data);
    if (!valid) return null;
    
    // Decode payload
    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson);
    
    // Check expiry
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    
    return payload;
  } catch {
    return null;
  }
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  // Add padding
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecode(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  return atob(base64);
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  // Security headers for all responses
  const addSecurityHeaders = (res: NextResponse) => {
    res.headers.set('x-request-id', requestId);
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    // HSTS in production
    if (process.env.NODE_ENV === 'production') {
      res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    return res;
  };

  // Public paths that don't need auth
  const publicPaths = ['/auth/login', '/auth/register', '/auth/verify', '/', '/shops', '/search', '/products', '/about', '/privacy', '/terms', '/how-it-works', '/contact', '/api/auth/login', '/api/auth/register', '/api/auth/otp', '/api/products', '/api/shops', '/api/master-products', '/api/master-categories'];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/')) || pathname.startsWith('/_next') || pathname.includes('.');

  // Protected prefixes with RBAC per point 61, 64
  const protectedPrefixes = [
    { prefix: '/shopkeeper', roles: ['shop_owner', 'shop_employee', 'admin', 'super_admin'] },
    { prefix: '/admin', roles: ['admin', 'super_admin'] },
    { prefix: '/orders', roles: ['customer', 'shop_owner', 'shop_employee', 'admin', 'super_admin'] },
    { prefix: '/cart', roles: ['customer', 'shop_owner', 'shop_employee', 'admin', 'super_admin'] },
    { prefix: '/profile', roles: ['customer', 'shop_owner', 'shop_employee', 'admin', 'super_admin'] },
  ];

  const matchedProtection = protectedPrefixes.find(p => pathname.startsWith(p.prefix));
  const isApiProtected = pathname.startsWith('/api/') && !publicPaths.some(p => pathname.startsWith(p));

  // If protected, verify JWT signature - not just existence per audit CRITICAL
  if ((matchedProtection || isApiProtected) && !isPublic) {
    if (!token) {
      if (pathname.startsWith('/api/')) {
        const res = NextResponse.json({ error: 'Authentication required', requestId }, { status: 401 });
        return addSecurityHeaders(res);
      }
      // For page routes, redirect to login if shopkeeper/admin, otherwise allow client-side handling
      if (pathname.startsWith('/shopkeeper') || pathname.startsWith('/admin')) {
        const res = NextResponse.redirect(new URL('/auth/login', request.url));
        return addSecurityHeaders(res);
      }
      // For customer routes, let page handle (will show login prompt)
      const res = NextResponse.next();
      return addSecurityHeaders(res);
    }

    // Verify JWT signature - CRITICAL fix
    const secret = process.env.JWT_SECRET || 'fallback-secret-min-32-chars-long';
    const payload = await verifyJWTEdge(token, secret);
    
    if (!payload) {
      // Invalid or expired token
      if (pathname.startsWith('/api/')) {
        const res = NextResponse.json({ error: 'Invalid or expired session', requestId }, { status: 401 });
        // Clear invalid cookie
        res.cookies.delete('auth-token');
        return addSecurityHeaders(res);
      }
      const res = NextResponse.redirect(new URL('/auth/login', request.url));
      res.cookies.delete('auth-token');
      return addSecurityHeaders(res);
    }

    // RBAC check per point 61
    if (matchedProtection) {
      const allowedRoles = matchedProtection.roles;
      if (!allowedRoles.includes(payload.role)) {
        if (pathname.startsWith('/api/')) {
          const res = NextResponse.json({ error: 'Forbidden - insufficient permissions', requestId }, { status: 403 });
          return addSecurityHeaders(res);
        }
        // Redirect to appropriate dashboard or login
        if (payload.role === 'customer') {
          const res = NextResponse.redirect(new URL('/', request.url));
          return addSecurityHeaders(res);
        }
        const res = NextResponse.redirect(new URL('/auth/login', request.url));
        return addSecurityHeaders(res);
      }
    }

    // Add user info to headers for downstream
    const res = NextResponse.next();
    res.headers.set('x-user-id', payload.userId);
    res.headers.set('x-user-role', payload.role);
    res.headers.set('x-request-id', requestId);
    return addSecurityHeaders(res);
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/shopkeeper/:path*', '/admin/:path*', '/orders/:path*', '/cart', '/profile/:path*', '/api/:path*']
};
