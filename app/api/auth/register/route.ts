import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword, signToken, generateOrderNumber } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const { name, phone, email, password, role } = parsed.data;

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'User already exists with this phone/email' }, { status: 409 });
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const user = await prisma.user.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        passwordHash,
        role: role as any,
        profile: {
          create: {}
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ role })
      }
    });

    const token = signToken({ userId: user.id, role: user.role, phone: user.phone || undefined, email: user.email || undefined });

    const response = NextResponse.json({
      message: 'Registered successfully',
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
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
    console.error('Register error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
