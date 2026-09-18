import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse } from '@/lib/utils/requestId';
import { z } from 'zod';

const attributeDefSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'select', 'boolean', 'color']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select
  unit: z.string().optional()
});

const attributesSchema = z.object({
  attributes: z.array(attributeDefSchema)
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  try {
    const category = await prisma.masterCategory.findUnique({
      where: { id: params.id }
    });
    if (!category) return NextResponse.json(createErrorResponse('NOT_FOUND', 'Category not found', requestId, 404), { status: 404 });

    let attributes = [];
    try {
      attributes = category.attributes ? JSON.parse(category.attributes) : [];
    } catch {}

    return NextResponse.json({ success: true, attributes, category: { id: category.id, name: category.name, slug: category.slug }, requestId });
  } catch (e: any) {
    return NextResponse.json(createErrorResponse('FETCH_FAILED', e.message, requestId, 500), { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });
    if (!['admin', 'super_admin'].includes(payload.role)) {
      return NextResponse.json(createErrorResponse('FORBIDDEN', 'Admin only', requestId, 403), { status: 403 });
    }

    const body = await req.json();
    const parsed = attributesSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid attributes', requestId, 400, parsed.error.errors), { status: 400 });

    const updated = await prisma.masterCategory.update({
      where: { id: params.id },
      data: { attributes: JSON.stringify(parsed.data.attributes) }
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'CATEGORY_ATTRIBUTES_UPDATED',
        entity: 'MasterCategory',
        entityId: params.id,
        metadata: JSON.stringify({ attributes: parsed.data.attributes, requestId })
      }
    });

    return NextResponse.json({ success: true, category: updated, requestId });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('UPDATE_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
