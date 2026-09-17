import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/master-categories - list all master categories for ALL product types (medical to hardware)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    const where: any = { isActive: true };
    if (parentId) {
      where.parentId = parentId;
    } else if (searchParams.get('root') === 'true') {
      where.parentId = null;
    }

    const categories = await prisma.masterCategory.findMany({
      where,
      include: {
        children: includeChildren ? { where: { isActive: true } } : false,
        _count: { select: { masterProducts: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ categories });
  } catch (e: any) {
    console.error('Master categories fetch error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/master-categories - create master category (admin only)
export async function POST(req: NextRequest) {
  try {
    const { cookies } = await import('next/headers');
    const { verifyToken } = await import('@/lib/auth/jwt');
    
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload || !['admin', 'super_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, parentId, description, icon, attributes } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const category = await prisma.masterCategory.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        description,
        icon,
        attributes: attributes ? JSON.stringify(attributes) : null
      }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (e: any) {
    console.error('Master category create error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
