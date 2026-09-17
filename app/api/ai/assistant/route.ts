import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { aiService } from '@/lib/ai/service';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, conversationId, shopId } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId: payload.userId }
      });
    }
    
    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: payload.userId,
          shopId: shopId || null,
          role: payload.role === 'customer' ? 'customer' : 'shopkeeper',
          title: message.slice(0, 50)
        }
      });
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    });

    // Check if it's shopping assistant intent
    let response;
    let toolCalls: any[] = [];

    if (payload.role === 'customer') {
      // Smart shopping assistant
      const shoppingList = await aiService.generateShoppingList(message, { shopId, userId: payload.userId });
      
      if (shoppingList.items && shoppingList.items.length > 0) {
        // Try to match products in DB if shopId provided
        let matchedProducts: any[] = [];
        if (shopId) {
          for (const item of shoppingList.items) {
            const products = await prisma.product.findMany({
              where: {
                shopId,
                name: { contains: item.name.split(' ')[0] },
                isActive: true
              },
              take: 1,
              include: { images: true }
            });
            if (products.length > 0) {
              matchedProducts.push({ ...item, matchedProduct: products[0] });
            } else {
              matchedProducts.push(item);
            }
          }
        } else {
          matchedProducts = shoppingList.items;
        }

        response = {
          type: 'shopping_list',
          message: `I understood you need materials for: "${message}". Here's a structured list. Please review before adding to cart.`,
          items: matchedProducts,
          clarifications: shoppingList.clarifications,
          confidence: shoppingList.confidence
        };
        toolCalls.push({ tool: 'generateShoppingList', input: message, output: shoppingList });
      } else {
        // General search
        const searchFilters = await aiService.parseSearchQuery(message);
        const products = await prisma.product.findMany({
          where: {
            ...(shopId ? { shopId } : {}),
            OR: searchFilters.keywords?.map((k: string) => ({ name: { contains: k } })) || [{ name: { contains: message } }],
            isActive: true
          },
          take: 10,
          include: { images: true }
        });

        response = {
          type: 'product_search',
          message: `Found ${products.length} products matching "${message}"`,
          products,
          filters: searchFilters
        };
        toolCalls.push({ tool: 'search_products', input: searchFilters, output: products.length });
      }
    } else {
      // Shopkeeper business assistant
      const businessResult = await aiService.businessAssistant(message, { shopId: shopId || '', userId: payload.userId, role: payload.role });
      
      // Execute actual DB queries for business assistant
      let data: any = {};
      const lower = message.toLowerCase();
      
      if (lower.includes('sales') || lower.includes('revenue')) {
        const shop = await prisma.shop.findFirst({ where: { ownerId: payload.userId } });
        if (shop) {
          const today = new Date();
          today.setHours(0,0,0,0);
          const orders = await prisma.order.findMany({
            where: { shopId: shop.id, createdAt: { gte: today }, status: { in: ['COMPLETED','DELIVERED'] } }
          });
          const total = orders.reduce((sum, o) => sum + o.total, 0);
          data = { todaySales: total, orderCount: orders.length };
          response = {
            type: 'business_insight',
            message: `Today's sales: ₹${total.toFixed(2)} from ${orders.length} orders.`,
            data
          };
        }
      } else if (lower.includes('low stock') || lower.includes('out of stock')) {
        const shop = await prisma.shop.findFirst({ where: { ownerId: payload.userId } });
        if (shop) {
          const lowStock = await prisma.product.findMany({
            where: { shopId: shop.id, stock: { lte: 10 }, isActive: true },
            take: 10
          });
          data = { lowStock };
          response = {
            type: 'inventory_alert',
            message: `Found ${lowStock.length} low stock products.`,
            data
          };
        }
      } else {
        response = businessResult;
      }
    }

    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: JSON.stringify(response),
        toolCalls: JSON.stringify(toolCalls)
      }
    });

    for (const tc of toolCalls) {
      await prisma.aIToolCall.create({
        data: {
          messageId: assistantMessage.id,
          toolName: tc.tool,
          input: JSON.stringify(tc.input),
          output: JSON.stringify(tc.output)
        }
      });
    }

    return NextResponse.json({ conversationId: conversation.id, response });
  } catch (e: any) {
    console.error('AI assistant error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: payload.userId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  return NextResponse.json({ conversations });
}
