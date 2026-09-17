import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { orderStatusUpdateSchema } from '@/lib/validation/schemas';
import { transitionOrder } from '@/lib/orders/service';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { rateLimitMiddleware } from '@/lib/rate-limit/simple';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(req, 'order_status');
    if (!rateLimit.allowed) {
      return NextResponse.json(createErrorResponse('RATE_LIMITED', 'Too many status updates', requestId, 429), { status: 429, headers: rateLimit.headers });
    }

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Authentication required',requestId,401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Invalid session',requestId,401), { status: 401 });

    const body = await req.json();
    const parsed = orderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED','Invalid status data',requestId,400,parsed.error.errors), { status: 400 });

    const { status: newStatus, reason } = parsed.data;

    // Use centralized order transition service - validates state, actor, permissions, inventory
    const result = await transitionOrder(params.id, newStatus, payload.userId, payload.role, reason);

    if (!result.success) {
      const statusCode = result.errorCode === 'ORDER_NOT_FOUND' ? 404 : result.errorCode?.includes('UNAUTHORIZED') ? 403 : result.errorCode === 'INVALID_ORDER_STATE' ? 400 : 500;
      
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? 'error' : 'warn',
        message: `Order transition failed: ${result.error}`,
        route: `/api/orders/${params.id}/status`,
        userId: payload.userId,
        orderId: params.id,
        metadata: { attempted: newStatus, errorCode: result.errorCode }
      });

      return NextResponse.json(createErrorResponse(result.errorCode || 'TRANSITION_FAILED', result.error || 'Failed to transition order', requestId, statusCode), { status: statusCode });
    }

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Order ${params.id} transitioned to ${newStatus}`,
      route: `/api/orders/${params.id}/status`,
      userId: payload.userId,
      orderId: params.id,
      metadata: { to: newStatus, reason }
    });

    return NextResponse.json({ success: true, order: result.order, message: `Order ${newStatus.toLowerCase().replace(/_/g, ' ')}`, requestId }, { headers: rateLimit.headers });
  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Status update failed',
      route: `/api/orders/${params.id}/status`,
      error: e.message
    });
    return NextResponse.json(createErrorResponse('STATUS_UPDATE_FAILED',e.message,requestId,500), { status: 500 });
  }
}
