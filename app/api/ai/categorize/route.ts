import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['shop_owner','shop_employee','admin'].includes(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { productName, description } = await req.json();
  if (!productName) return NextResponse.json({ error: 'productName required' }, { status: 400 });

  const categorization = await aiService.categorizeProduct(productName);
  const generatedDesc = await aiService.generateDescription({
    name: productName,
    category: categorization.category,
    brand: categorization.brand,
    size: categorization.size
  });

  return NextResponse.json({
    categorization,
    description: generatedDesc,
    message: 'Review and edit before saving'
  });
}
