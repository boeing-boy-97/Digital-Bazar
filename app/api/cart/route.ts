import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ carts: [] });
    
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ carts: [] });

    let carts: any[] = [];
    try {
      carts = await prisma.cart.findMany({
        where: { userId: payload.userId },
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          }
        }
      });
    } catch (dbErr: any) {
      console.error('[cart GET] DB error:', dbErr?.message);
      return NextResponse.json({ carts: [], error: 'Unable to load cart temporarily' });
    }

    return NextResponse.json({ carts });
  } catch (e: any) {
    console.error('[cart GET] Unhandled:', e?.message);
    return NextResponse.json({ carts: [] });
  }
}
