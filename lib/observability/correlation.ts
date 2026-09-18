// Observability: Correlation IDs per point 71
import { NextRequest } from 'next/server';

export function getCorrelationId(req?: NextRequest): string {
  if (req) {
    const header = req.headers.get('x-correlation-id') || req.headers.get('x-request-id');
    if (header) return header;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function logWithCorrelation(level: 'info' | 'warn' | 'error', message: string, meta?: any, correlationId?: string) {
  const cid = correlationId || getCorrelationId();
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    correlationId: cid,
    level,
    message,
    ...meta
  };
  if (level === 'error') console.error(JSON.stringify(logEntry));
  else if (level === 'warn') console.warn(JSON.stringify(logEntry));
  else console.log(JSON.stringify(logEntry));
  return cid;
}

export function createCorrelationHeaders(correlationId: string): Record<string, string> {
  return {
    'x-correlation-id': correlationId,
    'x-request-id': correlationId
  };
}
