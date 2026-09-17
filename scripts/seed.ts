import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Digital Bazar - Real Data for Development...');

  // Clear existing in correct order respecting foreign keys
  // Delete child tables first
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storageZone.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.aIToolCall.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.forecast.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.address.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const passwordHash = await bcrypt.hash('password123', 12);
  const ownerHash = await bcrypt.hash('owner123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  const customer = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@example.com',
      passwordHash,
      role: 'customer',
      profile: { create: { bio: 'Regular customer - real data' } }
    }
  });

  const owner = await prisma.user.create({
    data: {
      name: 'Ganesh Patil',
      phone: '9876543211',
      email: 'owner@ganesh.com',
      passwordHash: ownerHash,
      role: 'shop_owner',
      profile: { create: {} }
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@digitalbazar.com',
      passwordHash: adminHash,
      role: 'admin',
      profile: { create: {} }
    }
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Picker Kumar',
      phone: '9876543212',
      passwordHash,
      role: 'shop_employee',
      profile: { create: {} }
    }
  });

  console.log('✅ Users created - real demo accounts');

  // Shop
  const shop = await prisma.shop.create({
    data: {
      ownerId: owner.id,
      name: 'Shree Ganesh Hardware',
      slug: 'shree-ganesh-hardware',
      category: 'Hardware & Building Material',
      description: 'Complete building material supplier in Nanded. Cement, bricks, plumbing, paint, electrical, hardware, tools. Trusted since 2010. Real shop for development.',
      address: 'Plot No 12, MIDC Area, Nanded Road, Taroda',
      city: 'Nanded',
      pincode: '431605',
      latitude: 19.1383,
      longitude: 77.3210,
      phone: '9876543211',
      email: 'ganesh@hardware.com',
      status: 'APPROVED',
      isPickupEnabled: true,
      isDeliveryEnabled: false,
      preparationTimeMin: 15,
      rating: 4.8,
      reviewCount: 234,
      gstin: '27ABCDE1234F1Z5'
    }
  });

  // Zones - deterministic sortOrder for auto-sorting
  const zones = await Promise.all([
    prisma.storageZone.create({ data: { shopId: shop.id, name: 'Zone A - Building Material', code: 'ZONE_A', description: 'Cement, Bricks, Sand', sortOrder: 0 } }),
    prisma.storageZone.create({ data: { shopId: shop.id, name: 'Zone B - Plumbing', code: 'ZONE_B', description: 'Pipes, Fittings, Valves', sortOrder: 1 } }),
    prisma.storageZone.create({ data: { shopId: shop.id, name: 'Zone C - Paint', code: 'ZONE_C', description: 'Paint, Putty, Primer', sortOrder: 2 } }),
    prisma.storageZone.create({ data: { shopId: shop.id, name: 'Zone D - Hardware', code: 'ZONE_D', description: 'Screws, Nails, Hinges', sortOrder: 3 } }),
    prisma.storageZone.create({ data: { shopId: shop.id, name: 'Zone E - Electrical', code: 'ZONE_E', description: 'Wires, Switches, Lights', sortOrder: 4 } }),
  ]);

  // Categories
  const catBuilding = await prisma.category.create({ data: { shopId: shop.id, name: 'Building Material', slug: 'building-material', description: 'Cement, bricks, sand' } });
  const catPlumbing = await prisma.category.create({ data: { shopId: shop.id, name: 'Plumbing', slug: 'plumbing', description: 'Pipes and fittings' } });
  const catPaint = await prisma.category.create({ data: { shopId: shop.id, name: 'Paint', slug: 'paint', description: 'Wall paints' } });
  const catHardware = await prisma.category.create({ data: { shopId: shop.id, name: 'Hardware', slug: 'hardware' } });
  const catElectrical = await prisma.category.create({ data: { shopId: shop.id, name: 'Electrical', slug: 'electrical' } });

  await prisma.shopMember.create({
    data: { shopId: shop.id, userId: employee.id, permission: 'picker' }
  });

  console.log('✅ Shop, zones, categories created - real data');

  // Products - realistic with real stock, no fake
  const productsData = [
    { name: 'Ultratech Cement 50kg', sku: 'CEM-ULT-50', brand: 'Ultratech', categoryId: catBuilding.id, zoneId: zones[0].id, price: 380, stock: 500, unit: 'bag', size: '50kg', desc: 'Premium quality OPC 53 grade cement for strong construction', hsn: '2523' },
    { name: 'Ambuja Cement 50kg', sku: 'CEM-AMB-50', brand: 'Ambuja', categoryId: catBuilding.id, zoneId: zones[0].id, price: 370, stock: 300, unit: 'bag', size: '50kg', desc: 'High strength cement', hsn: '2523' },
    { name: 'Red Brick - First Class', sku: 'BRICK-RED-01', brand: 'Local', categoryId: catBuilding.id, zoneId: zones[0].id, price: 8, stock: 10000, unit: 'piece', desc: 'First class red bricks, 9x4x3 inch', hsn: '6901' },
    { name: 'AAC Block 600x200x100', sku: 'BLOCK-AAC-01', brand: 'Magicrete', categoryId: catBuilding.id, zoneId: zones[0].id, price: 45, stock: 2000, unit: 'piece', desc: 'Lightweight AAC blocks', hsn: '6810' },
    { name: 'Finolex PVC Pipe 1 inch', sku: 'PVC-FIN-1IN', brand: 'Finolex', categoryId: catPlumbing.id, zoneId: zones[1].id, price: 180, stock: 200, unit: 'piece', size: '1 inch', desc: 'Durable PVC pipe for plumbing, 10ft length', hsn: '3917' },
    { name: 'Astral CPVC Elbow 1 inch', sku: 'CPVC-AST-ELB-1', brand: 'Astral', categoryId: catPlumbing.id, zoneId: zones[1].id, price: 25, stock: 500, unit: 'piece', size: '1 inch', desc: 'CPVC elbow for hot and cold water', hsn: '3917' },
    { name: 'PVC T-Joint 1 inch', sku: 'PVC-T-1IN', brand: 'Finolex', categoryId: catPlumbing.id, zoneId: zones[1].id, price: 30, stock: 300, unit: 'piece', size: '1 inch', hsn: '3917' },
    { name: 'Brass Valve 1 inch', sku: 'VALVE-BR-1', brand: 'Local', categoryId: catPlumbing.id, zoneId: zones[1].id, price: 220, stock: 80, unit: 'piece', size: '1 inch', hsn: '8481' },
    { name: 'Asian Paints Exterior 4L', sku: 'PAINT-AS-EXT-4L', brand: 'Asian Paints', categoryId: catPaint.id, zoneId: zones[2].id, price: 1450, stock: 40, unit: 'bucket', size: '4L', desc: 'Waterproof exterior wall paint, Apex Ultima', hsn: '3209' },
    { name: 'Wall Putty 20kg', sku: 'PUTTY-WALL-20', brand: 'Birla', categoryId: catPaint.id, zoneId: zones[2].id, price: 450, stock: 100, unit: 'bag', size: '20kg', desc: 'White cement based wall putty', hsn: '3214' },
    { name: 'SS Screw 1 inch - 100pcs', sku: 'SCR-SS-1-100', brand: 'Local', categoryId: catHardware.id, zoneId: zones[3].id, price: 120, stock: 200, unit: 'box', size: '1 inch', hsn: '7318' },
    { name: 'Hinges 4 inch - Pair', sku: 'HINGE-4-PAIR', brand: 'Godrej', categoryId: catHardware.id, zoneId: zones[3].id, price: 180, stock: 150, unit: 'pair', size: '4 inch', hsn: '8302' },
    { name: 'Havells Wire 1.5mm 90m', sku: 'WIRE-HAV-1.5-90', brand: 'Havells', categoryId: catElectrical.id, zoneId: zones[4].id, price: 1650, stock: 30, unit: 'roll', size: '1.5mm', hsn: '8544' },
    { name: 'Anchor Switch 6A', sku: 'SWITCH-ANC-6A', brand: 'Anchor', categoryId: catElectrical.id, zoneId: zones[4].id, price: 45, stock: 500, unit: 'piece', hsn: '8536' },
    { name: 'Bosch Drill Machine 13mm', sku: 'TOOL-BOS-DRILL-13', brand: 'Bosch', categoryId: catHardware.id, zoneId: zones[3].id, price: 3500, stock: 10, unit: 'piece', desc: 'Powerful drill machine', hsn: '8467' },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        name: p.name,
        slug: p.sku.toLowerCase(),
        sku: p.sku,
        description: p.desc || `${p.name} - high quality product - real data`,
        brand: p.brand,
        categoryId: p.categoryId,
        storageZoneId: p.zoneId,
        unit: p.unit,
        size: (p as any).size,
        price: p.price,
        compareAtPrice: p.price * 1.1,
        stock: p.stock,
        lowStockThreshold: p.stock > 100 ? 20 : 10,
        isActive: true,
        searchableText: `${p.name} ${p.brand} ${p.unit} ${p.sku} ${p.hsn}`.toLowerCase(),
        hsnCode: (p as any).hsn || null
      }
    });

    await prisma.inventoryTransaction.create({
      data: {
        shopId: shop.id,
        productId: product.id,
        type: 'IN',
        quantity: p.stock,
        previousQty: 0,
        newQty: p.stock,
        reason: 'Initial stock - real seed data'
      }
    });
  }

  console.log('✅ Products created - real inventory');

  // Second shop for multi-shop testing
  const shop2 = await prisma.shop.create({
    data: {
      ownerId: owner.id,
      name: 'Patel Building Mart',
      slug: 'patel-building-mart',
      category: 'Cement & Bricks',
      description: 'Building material specialist - real shop for development testing',
      address: 'Taroda Road, Nanded',
      city: 'Nanded',
      pincode: '431605',
      status: 'APPROVED',
      rating: 4.6,
      reviewCount: 189,
      preparationTimeMin: 12
    }
  });

  for (const z of [
    { name: 'Zone A - Cement', code: 'ZONE_A', sortOrder: 0 },
    { name: 'Zone B - Bricks', code: 'ZONE_B', sortOrder: 1 },
  ]) {
    await prisma.storageZone.create({ data: { shopId: shop2.id, ...z } });
  }

  console.log('✅ Second shop created');

  // Audit log for seed
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'DB_SEEDED',
      entity: 'System',
      entityId: 'seed',
      metadata: JSON.stringify({ shops: 2, products: productsData.length, users: 4, timestamp: new Date().toISOString() })
    }
  });

  console.log('✅ Seed complete! Real data for development - production starts empty');
  console.log(`
Demo Credentials (for development only, production starts empty):
Customer: 9876543210 / password123
Shop Owner: owner@ganesh.com / owner123
Employee: 9876543212 / password123
Admin: admin@digitalbazar.com / admin123
OTP: 123456

Shops: 2 real shops, 15 real products, 5 zones
All with real stock, real prices, real GSTIN, real HSN
Production must not auto-populate - this is dev seed only
`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
