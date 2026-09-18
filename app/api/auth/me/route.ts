import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ user: null }, { status: 200 });

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { profile: true, shopsOwned: { select: { id: true, name: true, slug: true } } }
      });
    } catch (dbErr: any) {
      console.error('[auth me GET] DB error:', dbErr?.message);
      return NextResponse.json({ user: null, fallback: true }, { status: 200 });
    }

    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        shops: user.shopsOwned
      }
    });
  } catch (e: any) {
    console.error('[auth me GET] Unhandled:', e?.message);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
