import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import prisma from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, shopId } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });

    const identification = await aiService.identifyProductFromImage(imageBase64);

    let products: any[] = [];
    if (identification.searchKeywords && identification.searchKeywords.length > 0) {
      const where: any = { isActive: true };
      if (shopId) where.shopId = shopId;
      
      where.OR = identification.searchKeywords.map((k: string) => ({
        name: { contains: k }
      }));

      products = await prisma.product.findMany({
        where,
        include: { images: true },
        take: 10
      });
    }

    return NextResponse.json({
      identification,
      products,
      message: identification.confidence < 0.6 
        ? 'Low confidence match - please verify results'
        : `Identified as ${identification.category} - ${identification.productType}`,
      disclaimer: 'AI identification is approximate, verify before ordering'
    });
  } catch (e: any) {
    console.error('Vision error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
