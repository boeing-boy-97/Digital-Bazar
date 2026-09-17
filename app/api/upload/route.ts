import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { validateFileUpload, generateSafeFileName } from '@/lib/storage/validation';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { rateLimitMiddleware } from '@/lib/rate-limit/simple';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(req, 'upload');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createErrorResponse('RATE_LIMITED', 'Too many upload requests', requestId, 429),
        { status: 429, headers: rateLimit.headers }
      );
    }

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401),
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || !['shop_owner','shop_employee','admin'].includes(payload.role)) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', 'Only shop owners can upload', requestId, 403),
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        createErrorResponse('MISSING_FILE', 'File required', requestId, 400),
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFileUpload({
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (!validation.valid) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'File validation failed',
        route: '/api/upload',
        userId: payload.userId,
        metadata: { error: validation.error, code: validation.code, fileName: file.name }
      });
      
      return NextResponse.json(
        createErrorResponse(validation.code || 'INVALID_FILE', validation.error || 'Invalid file', requestId, 400),
        { status: 400 }
      );
    }

    // Generate safe filename - never trust user-supplied
    const safeName = generateSafeFileName(file.name);
    
    // In production: upload to S3/Supabase Storage
    // For dev: we would save to public/uploads with safe name
    // const buffer = await file.arrayBuffer();
    // await saveToStorage(buffer, safeName);

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'File uploaded successfully',
      route: '/api/upload',
      userId: payload.userId,
      metadata: { safeName, originalName: file.name, size: file.size, type: file.type }
    });

    // Mock URL for dev
    const url = `/uploads/${safeName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName: safeName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      requestId
    }, { headers: rateLimit.headers });

  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Upload failed',
      route: '/api/upload',
      error: e.message
    });

    return NextResponse.json(
      createErrorResponse('UPLOAD_FAILED', 'File upload failed', requestId, 500),
      { status: 500 }
    );
  }
}
