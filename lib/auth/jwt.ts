import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-min-32-chars-long';

export interface JWTPayload {
  userId: string;
  role: string;
  phone?: string;
  email?: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function generateOTP(): string {
  // In production, NEVER return hardcoded test code per audit CRITICAL
  if (process.env.NODE_ENV !== 'production' && process.env.OTP_ENABLED === 'true' && process.env.OTP_TEST_CODE) {
    console.warn('[SECURITY] Using test OTP code - only allowed in non-production');
    return process.env.OTP_TEST_CODE;
  }
  // Production: real random OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateOrderNumber(): string {
  const prefix = 'DB';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${timestamp}${random}`;
}

export function generateQRToken(): string {
  // Legacy simple token - kept for backward compat, but new secure token preferred
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'QR-';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Secure QR token with HMAC per point 37: single-use, expiry, auth, second scan fail
export function generateSecureQRToken(orderId: string, shopId: string): { token: string; expiry: Date } {
  const crypto = require('crypto');
  const secret = process.env.JWT_SECRET || 'fallback-secret-min-32-chars-long';
  const nonce = crypto.randomBytes(8).toString('hex');
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min per spec
  const payload = `${orderId}.${shopId}.${nonce}.${expiry.getTime()}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
  const token = `QR-${nonce}-${hmac}`;
  return { token, expiry };
}

export function verifySecureQRTokenFormat(token: string): boolean {
  // Basic format check: QR-<nonce>-<hmac>
  return /^QR-[a-f0-9]{16}-[a-f0-9]{32}$/.test(token);
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}${month}-${random}`;
}
