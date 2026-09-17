import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dev data with paise money model...');

  const passwordHash = await bcrypt.hash('password123', 12);
  const ownerHash = await bcrypt.hash('owner123', 12);

  // Users
  const customer = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@example.com',
      passwordHash,
      role: 'customer'
    }
  });

  const owner = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      name: 'Ganesh Patil',
      phone: '9876543211',
      email: 'owner@ganesh.com',
      passwordHash: ownerHash,
      role: 'shop_owner'
    }
  });

  // Shop with structured business hours
  const shop = await prisma.shop.upsert({
    where: { slug: 'shree-ganesh-hardware' },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Shree Ganesh Hardware',
      slug: 'shree-ganesh-hardware',
      category: 'Hardware & Building Material',
      description: 'Complete building material supplier in Nagpur. Cement, bricks, plumbing, paint, electrical, hardware, tools. Trusted since 2010. Real shop with real inventory.',
      address: 'Plot No 12, MIDC Area, Nagpur',
      city: 'Nagpur',
      pincode: '440001',
      latitude: 21.1458,
      longitude: 79.0882,
      phone: '9876543211',
      email: 'ganesh@hardware.com',
      status: 'APPROVED',
      timezone: 'Asia/Kolkata',
      isPickupEnabled: true,
      isDeliveryEnabled: false,
      preparationTimeMin: 15,
      maxActiveOrders: 50,
      rating: 4.8,
      reviewCount: 12,
      businessHours: {
        create: [
          { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
          { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
          { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
          { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
          { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
          { dayOfWeek: 6, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
          { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false, sortOrder: 0 },
        ]
      }
    }
  });

  // Zones
  const zones = [];
  for (const z of [
    { name: 'Zone A - General', code: 'ZONE_A', sortOrder: 0 },
    { name: 'Zone B - Building', code: 'ZONE_B', sortOrder: 1 },
    { name: 'Zone C - Plumbing', code: 'ZONE_C', sortOrder: 2 },
  ]) {
    const zone = await prisma.storageZone.upsert({
      where: { shopId_code: { shopId: shop.id, code: z.code } },
      update: {},
      create: { shopId: shop.id, ...z }
    });
    zones.push(zone);
  }

  // Master category for linking
  const masterCat = await prisma.masterCategory.findFirst();

  // Products with paise
  const products = [
    { name: 'Ultratech Cement 50kg', sku: 'CEM-ULT-50', pricePaise: 38000, stock: 500, unit: 'bag', brand: 'Ultratech', zone: zones[0].id },
    { name: 'Finolex PVC Pipe 1 inch', sku: 'PVC-FIN-1IN', pricePaise: 18000, stock: 200, unit: 'piece', brand: 'Finolex', zone: zones[2].id },
    { name: 'Asian Paints Exterior 4L', sku: 'PAINT-AS-EXT-4L', pricePaise: 145000, stock: 40, unit: 'bucket', brand: 'Asian Paints', zone: zones[0].id },
    { name: 'Havells Wire 1.5mm 90m', sku: 'WIRE-HAV-1.5-90', pricePaise: 165000, stock: 30, unit: 'roll', brand: 'Havells', zone: zones[1].id },
    { name: 'Paracetamol 500mg 10pcs', sku: 'MED-PARA-500', pricePaise: 2500, stock: 100, unit: 'strip', brand: 'Generic', zone: zones[0].id },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { shopId: shop.id, sku: p.sku } });
    if (existing) continue;
    const prod = await prisma.product.create({
      data: {
        shopId: shop.id,
        name: p.name,
        slug: `${p.sku.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        sku: p.sku,
        brand: p.brand,
        unit: p.unit,
        pricePaise: p.pricePaise,
        stock: p.stock,
        storageZoneId: p.zone,
        isActive: true,
        searchableText: `${p.name} ${p.brand} ${p.sku}`.toLowerCase(),
        lowStockThreshold: 10,
        minOrderQty: 1
      }
    });
    await prisma.inventoryTransaction.create({
      data: {
        shopId: shop.id,
        productId: prod.id,
        type: 'IN',
        quantity: p.stock,
        previousQty: 0,
        newQty: p.stock,
        reason: 'Seed dev data - real inventory'
      }
    });
  }

  console.log('✅ Dev seed completed with paise model');
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});
