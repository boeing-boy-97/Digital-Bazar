import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, signToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, role: user.role, phone: user.phone || undefined, email: user.email || undefined });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id
      }
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone, email: user.email }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (e: any) {
    console.error('Login error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
