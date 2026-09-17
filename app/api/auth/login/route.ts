import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, signToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';
import { rateLimitMiddleware } from '@/lib/rate-limit/simple';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Rate limiting login - 5 per 15 min per IP per point 77
    const rateLimit = rateLimitMiddleware(req as any, 'auth');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createErrorResponse('RATE_LIMITED', 'Too many login attempts. Please wait 15 minutes.', requestId, 429),
        { status: 429, headers: rateLimit.headers }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_FAILED', 'Invalid login data', requestId, 400, parsed.error.errors),
        { status: 400, headers: rateLimit.headers }
      );
    }

    const { phone, email, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (!user || !user.passwordHash) {
      logStructured({ requestId, level: 'warn', message: 'Login failed - user not found', route: '/api/auth/login', metadata: { phone, email } });
      return NextResponse.json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid credentials', requestId, 401), { status: 401, headers: rateLimit.headers });
    }

    if (!user.isActive) {
      return NextResponse.json(createErrorResponse('ACCOUNT_SUSPENDED', 'Account suspended. Contact support.', requestId, 403), { status: 403, headers: rateLimit.headers });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          metadata: JSON.stringify({ reason: 'invalid_password', requestId })
        }
      });
      return NextResponse.json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid credentials', requestId, 401), { status: 401, headers: rateLimit.headers });
    }

    const token = signToken({ userId: user.id, role: user.role, phone: user.phone || undefined, email: user.email || undefined });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ requestId, role: user.role })
      }
    });

    logStructured({ requestId, level: 'info', message: 'User login success', route: '/api/auth/login', userId: user.id, metadata: { role: user.role } });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone, email: user.email },
      requestId
    }, { headers: rateLimit.headers });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (e: any) {
    logStructured({ requestId, level: 'error', message: 'Login error', route: '/api/auth/login', error: e.message });
    return NextResponse.json(createErrorResponse('INTERNAL_ERROR', 'Internal error', requestId, 500), { status: 500 });
  }
}
