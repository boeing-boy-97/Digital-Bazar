import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateOTP, signToken } from '@/lib/auth/jwt';
import { otpVerifySchema } from '@/lib/validation/schemas';

// In-memory OTP store for demo - in production use Redis
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, action } = body;

  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

  if (action === 'send') {
    const otp = generateOTP();
    otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP] ${phone}: ${otp} - TEST CODE ${process.env.OTP_TEST_CODE}`);
    
    // In production, send via SMS provider
    return NextResponse.json({ 
      message: 'OTP sent',
      // Only in development
      ...(process.env.OTP_ENABLED === 'true' ? { testOtp: otp } : {})
    });
  }

  if (action === 'verify') {
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const { phone: p, otp, name } = parsed.data;
    const stored = otpStore.get(p);
    
    // Allow test OTP
    const isTestOtp = otp === process.env.OTP_TEST_CODE && process.env.OTP_ENABLED === 'true';
    const isValidStored = stored && stored.otp === otp && stored.expires > Date.now();

    if (!isTestOtp && !isValidStored) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    otpStore.delete(p);

    let user = await prisma.user.findUnique({ where: { phone: p } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: p,
          name: name || `User ${p.slice(-4)}`,
          role: 'customer',
          profile: { create: {} }
        }
      });
    }

    const token = signToken({ userId: user.id, role: user.role, phone: user.phone || undefined });

    const response = NextResponse.json({
      message: 'OTP verified',
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
