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
  if (process.env.OTP_ENABLED === 'true' && process.env.OTP_TEST_CODE) {
    return process.env.OTP_TEST_CODE;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateOrderNumber(): string {
  const prefix = 'DB';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${timestamp}${random}`;
}

export function generateQRToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'QR-';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}${month}-${random}`;
}
