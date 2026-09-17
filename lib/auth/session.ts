import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';
import prisma from '@/lib/db/prisma';

export async function getSession(): Promise<(JWTPayload & { user?: any }) | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  // Fetch user to ensure still active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true }
  });
  
  if (!user || !user.isActive) return null;
  
  return { ...payload, user };
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  
  return session;
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete('auth-token');
}
