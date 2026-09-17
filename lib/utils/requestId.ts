// Request ID / Correlation ID for observability

import { nanoid } from 'nanoid';

export function generateRequestId(): string {
  return `req_${Date.now()}_${nanoid(8)}`;
}

export function getRequestIdFromHeaders(headers: Headers): string {
  return headers.get('x-request-id') || generateRequestId();
}

export interface StructuredLog {
  requestId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  route?: string;
  userId?: string;
  shopId?: string;
  orderId?: string;
  metadata?: any;
  error?: any;
}

export function logStructured(log: StructuredLog) {
  // Never log sensitive: passwords, OTP, payment secrets, full card, sensitive tokens
  const sanitized = { ...log };
  if (sanitized.metadata) {
    const sensitiveKeys = ['password', 'otp', 'secret', 'card', 'token', 'apiKey'];
    for (const key of sensitiveKeys) {
      if (sanitized.metadata[key]) {
        sanitized.metadata[key] = '[REDACTED]';
      }
    }
  }
  
  console.log(JSON.stringify(sanitized));
}

export function createErrorResponse(code: string, message: string, requestId: string, status: number, details?: any) {
  // Structured error {code, message, requestId} - never stack traces to user
  return {
    success: false,
    error: {
      code,
      message, // human-friendly
      requestId,
      ...(details ? { details } : {})
    }
  };
}
