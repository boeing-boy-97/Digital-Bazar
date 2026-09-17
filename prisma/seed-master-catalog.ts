import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Master catalog for ALL product types: medical to hardware
const masterCategories = [
  // Building Materials
  { name: 'Building Material', slug: 'building-material', icon: '🏗️', description: 'Cement, bricks, sand, aggregates', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'grade', type: 'select', options: ['OPC 43', 'OPC 53', 'PPC'] }, { name: 'weight', type: 'text' }]) },
  { name: 'Cement', slug: 'cement', icon: '🏗️', description: 'All cement types', parentSlug: 'building-material', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'grade', type: 'select', options: ['OPC 43', 'OPC 53', 'PPC', 'White'] }, { name: 'bag_size', type: 'select', options: ['25kg', '50kg'] }]) },
  { name: 'Bricks & Blocks', slug: 'bricks-blocks', icon: '🧱', description: 'Bricks, blocks, tiles', parentSlug: 'building-material' },
  
  // Plumbing
  { name: 'Plumbing', slug: 'plumbing', icon: '🚿', description: 'Pipes, fittings, sanitaryware', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'material', type: 'select', options: ['PVC', 'CPVC', 'UPVC', 'Brass', 'SS'] }, { name: 'size', type: 'text' }]) },
  { name: 'Pipes', slug: 'pipes', icon: '🚿', parentSlug: 'plumbing' },
  { name: 'Sanitaryware', slug: 'sanitaryware', icon: '🚿', parentSlug: 'plumbing' },
  
  // Paint
  { name: 'Paint', slug: 'paint', icon: '🎨', description: 'Paints, primers, putty', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'color', type: 'text' }, { name: 'finish', type: 'select', options: ['Matte', 'Glossy', 'Satin', 'Emulsion'] }, { name: 'volume', type: 'select', options: ['1L', '4L', '10L', '20L'] }]) },
  
  // Electrical
  { name: 'Electrical', slug: 'electrical', icon: '💡', description: 'Wires, switches, lights, appliances', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'wattage', type: 'text' }, { name: 'voltage', type: 'text' }, { name: 'type', type: 'text' }]) },
  { name: 'Wires & Cables', slug: 'wires-cables', icon: '💡', parentSlug: 'electrical' },
  { name: 'Lighting', slug: 'lighting', icon: '💡', parentSlug: 'electrical' },
  
  // Hardware & Tools
  { name: 'Hardware', slug: 'hardware', icon: '🔩', description: 'Nuts, bolts, screws, fittings', attributes: JSON.stringify([{ name: 'material', type: 'select', options: ['MS', 'SS', 'Brass'] }, { name: 'size', type: 'text' }]) },
  { name: 'Tools', slug: 'tools', icon: '🛠️', description: 'Hand tools, power tools', parentSlug: 'hardware' },
  
  // Medical
  { name: 'Medical', slug: 'medical', icon: '💊', description: 'Medicines, medical supplies, equipment', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'dosage', type: 'text' }, { name: 'form', type: 'select', options: ['Tablet', 'Syrup', 'Injection', 'Capsule'] }]) },
  { name: 'Medicines', slug: 'medicines', icon: '💊', parentSlug: 'medical' },
  { name: 'Medical Equipment', slug: 'medical-equipment', icon: '🩺', parentSlug: 'medical' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', parentSlug: 'medical' },
  
  // Grocery & Daily Needs
  { name: 'Grocery', slug: 'grocery', icon: '🛒', description: 'Daily groceries, food items' },
  { name: 'Daily Needs', slug: 'daily-needs', icon: '🏠', description: 'Household daily needs' },
  
  // Electronics - Mobile etc for all products
  { name: 'Electronics', slug: 'electronics', icon: '📱', description: 'Mobiles, electronics, accessories', attributes: JSON.stringify([{ name: 'brand', type: 'text' }, { name: 'model', type: 'text' }, { name: 'ram', type: 'select', options: ['4GB', '6GB', '8GB', '12GB'] }, { name: 'storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB'] }, { name: 'color', type: 'text' }]) },
  { name: 'Mobile Phones', slug: 'mobile-phones', icon: '📱', parentSlug: 'electronics' },
  { name: 'Mobile Accessories', slug: 'mobile-accessories', icon: '🎧', parentSlug: 'electronics' },
  { name: 'Home Appliances', slug: 'home-appliances', icon: '🏠', parentSlug: 'electronics' },
  
  // Automotive
  { name: 'Automotive', slug: 'automotive', icon: '🚗', description: 'Auto parts, accessories' },
  
  // Agriculture
  { name: 'Agriculture', slug: 'agriculture', icon: '🌾', description: 'Seeds, fertilizers, tools' },
  
  // Fashion
  { name: 'Fashion', slug: 'fashion', icon: '👕', description: 'Clothing, footwear' },
  
  // General
  { name: 'General', slug: 'general', icon: '📦', description: 'General items' },
];

const masterProducts = [
  // Building Material
  { name: 'UltraTech Cement OPC 53 Grade 50kg', brand: 'UltraTech', categorySlug: 'cement', description: 'High strength OPC 53 grade cement for RCC work', attributes: { grade: 'OPC 53', bag_size: '50kg', type: 'Cement' }, specifications: { compressive_strength: '53 MPa', setting_time: '30 mins initial', brand: 'UltraTech' } },
  { name: 'ACC Cement PPC 50kg', brand: 'ACC', categorySlug: 'cement', description: 'PPC cement for general construction', attributes: { grade: 'PPC', bag_size: '50kg' } },
  { name: 'Red Clay Bricks 9x4x3 inch', brand: 'Local', categorySlug: 'bricks-blocks', description: 'First class red clay bricks', attributes: { size: '9x4x3', material: 'Clay' } },
  
  // Plumbing
  { name: 'Finolex PVC Pipe 4 inch 10ft', brand: 'Finolex', categorySlug: 'pipes', description: 'PVC pipe for drainage', attributes: { size: '4 inch', length: '10ft', material: 'PVC' } },
  { name: 'Ashirvad CPVC Pipe 1 inch', brand: 'Ashirvad', categorySlug: 'pipes', description: 'CPVC pipe for hot water', attributes: { size: '1 inch', material: 'CPVC' } },
  { name: 'Cera Wall Mount Basin', brand: 'Cera', categorySlug: 'sanitaryware', description: 'White ceramic wall mount basin' },
  
  // Paint
  { name: 'Asian Paints Apex Exterior Emulsion 10L White', brand: 'Asian Paints', categorySlug: 'paint', description: 'Weatherproof exterior emulsion', attributes: { color: 'White', finish: 'Emulsion', volume: '10L' } },
  { name: 'Berger Bison Acrylic Putty 20kg', brand: 'Berger', categorySlug: 'paint', description: 'Wall putty for smooth finish', attributes: { weight: '20kg', type: 'Putty' } },
  
  // Electrical
  { name: 'Finolex Electrical Wire 1.5 sqmm Red 90m', brand: 'Finolex', categorySlug: 'wires-cables', description: 'FR PVC insulated copper wire', attributes: { size: '1.5 sqmm', color: 'Red', length: '90m' } },
  { name: 'Havells Switch 6A White', brand: 'Havells', categorySlug: 'electrical', description: 'Modular switch 6A' },
  { name: 'Philips LED Bulb 9W', brand: 'Philips', categorySlug: 'lighting', description: '9W LED bulb cool white' },
  
  // Hardware
  { name: 'SS Screw 1 inch 100pcs', brand: 'Local', categorySlug: 'hardware', description: 'Stainless steel screws' },
  { name: 'Bosch Drill Machine 500W', brand: 'Bosch', categorySlug: 'tools', description: 'Impact drill machine 500W' },
  
  // Medical
  { name: 'Paracetamol 500mg Tablet 10pcs', brand: 'Generic', categorySlug: 'medicines', description: 'Fever and pain relief', attributes: { dosage: '500mg', form: 'Tablet', strip: '10' } },
  { name: 'Dettol Antiseptic Liquid 500ml', brand: 'Dettol', categorySlug: 'medical', description: 'Antiseptic liquid', attributes: { volume: '500ml', type: 'Antiseptic' } },
  { name: 'Digital Thermometer', brand: 'Omron', categorySlug: 'medical-equipment', description: 'Digital thermometer for fever check' },
  { name: 'Hand Sanitizer 500ml', brand: 'Himalaya', categorySlug: 'personal-care', description: 'Alcohol based hand sanitizer' },
  
  // Grocery
  { name: 'Aashirvaad Atta 10kg', brand: 'Aashirvaad', categorySlug: 'grocery', description: 'Whole wheat atta' },
  { name: 'Tata Salt 1kg', brand: 'Tata', categorySlug: 'grocery', description: 'Iodized salt' },
  
  // Electronics - Mobile
  { name: 'Redmi Note 15', brand: 'Redmi', categorySlug: 'mobile-phones', description: 'Redmi Note 15 smartphone', attributes: { ram: '8GB', storage: '128GB', color: 'Black', display: '6.67 inch AMOLED', battery: '5000mAh' }, specifications: { processor: 'Snapdragon 7s Gen 2', camera: '108MP + 8MP + 2MP', front_camera: '16MP', os: 'MIUI 15' } },
  { name: 'Redmi Note 15 Pro', brand: 'Redmi', categorySlug: 'mobile-phones', description: 'Redmi Note 15 Pro smartphone', attributes: { ram: '8GB', storage: '256GB', color: 'Blue' } },
  { name: 'Samsung Galaxy M34', brand: 'Samsung', categorySlug: 'mobile-phones', description: 'Samsung Galaxy M34 5G', attributes: { ram: '6GB', storage: '128GB' } },
  { name: 'USB-C Fast Charger 33W', brand: 'Mi', categorySlug: 'mobile-accessories', description: '33W fast charger USB-C' },
  { name: 'Bluetooth Earbuds', brand: 'Boat', categorySlug: 'mobile-accessories', description: 'True wireless earbuds' },
  
  // Home Appliances
  { name: 'Havells Ceiling Fan 1200mm', brand: 'Havells', categorySlug: 'home-appliances', description: 'Energy efficient ceiling fan' },
  
  // Automotive
  { name: 'Engine Oil 20W40 1L', brand: 'Castrol', categorySlug: 'automotive', description: 'Engine oil for bikes' },
  
  // Agriculture
  { name: 'Urea Fertilizer 50kg', brand: 'IFFCO', categorySlug: 'agriculture', description: 'Urea fertilizer for crops' },
];

async function main() {
  console.log('Seeding master catalog for ALL products (medical to hardware)...');
  
  // Create categories
  const categoryMap = new Map();
  
  // First pass: root categories
  for (const cat of masterCategories.filter(c => !c.parentSlug)) {
    const existing = await prisma.masterCategory.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      const created = await prisma.masterCategory.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          attributes: cat.attributes || null
        }
      });
      categoryMap.set(cat.slug, created.id);
      console.log(`Created category: ${cat.name}`);
    } else {
      categoryMap.set(cat.slug, existing.id);
    }
  }
  
  // Second pass: child categories
  for (const cat of masterCategories.filter(c => c.parentSlug)) {
    const parentId = categoryMap.get(cat.parentSlug!);
    if (!parentId) continue;
    
    const existing = await prisma.masterCategory.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      const created = await prisma.masterCategory.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          parentId,
          description: cat.description,
          icon: cat.icon,
          attributes: cat.attributes || null
        }
      });
      categoryMap.set(cat.slug, created.id);
      console.log(`Created child category: ${cat.name} under ${cat.parentSlug}`);
    } else {
      categoryMap.set(cat.slug, existing.id);
    }
  }
  
  // Create master products
  for (const prod of masterProducts) {
    const categoryId = prod.categorySlug ? categoryMap.get(prod.categorySlug) : null;
    const slug = `${prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;
    
    const existing = await prisma.masterProduct.findFirst({ where: { name: prod.name } });
    if (existing) {
      console.log(`Skipping existing product: ${prod.name}`);
      continue;
    }
    
    const searchableText = `${prod.name} ${prod.brand || ''} ${prod.description || ''} ${JSON.stringify(prod.attributes || {})}`.toLowerCase();
    
    const created = await prisma.masterProduct.create({
      data: {
        name: prod.name,
        slug,
        brand: prod.brand,
        categoryId: categoryId || null,
        description: prod.description,
        specifications: prod.specifications ? JSON.stringify(prod.specifications) : null,
        attributes: prod.attributes ? JSON.stringify(prod.attributes) : null,
        searchableText,
        variants: prod.name.includes('Redmi Note 15') ? {
          create: [
            { name: '8GB + 128GB', sku: `${slug}-8-128-${Date.now().toString().slice(-4)}`, attributes: JSON.stringify({ ram: '8GB', storage: '128GB' }) },
            { name: '8GB + 256GB', sku: `${slug}-8-256-${Date.now().toString().slice(-4)}`, attributes: JSON.stringify({ ram: '8GB', storage: '256GB' }) },
            { name: '12GB + 256GB', sku: `${slug}-12-256-${Date.now().toString().slice(-4)}`, attributes: JSON.stringify({ ram: '12GB', storage: '256GB' }) }
          ]
        } : undefined
      }
    });
    
    console.log(`Created master product: ${prod.name}`);
  }
  
  console.log('Master catalog seeding completed for ALL categories!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
