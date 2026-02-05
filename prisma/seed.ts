import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Buildings
  const building1 = await prisma.building.create({
    data: {
      name: 'المبنى الأول',
      address: 'شارع المحمدية، الدار البيضاء',
      totalFloors: 3,
    },
  });

  const building2 = await prisma.building.create({
    data: {
      name: 'المبنى الثاني',
      address: 'حي السلام، الرباط',
      totalFloors: 2,
    },
  });

  console.log('✅ Created 2 buildings');

  // Create Flats for Building 1
  const b1Flats = await Promise.all([
    // Floor 1
    prisma.flat.create({
      data: {
        referenceNum: 'B1-F1-001',
        buildingId: building1.id,
        floorNum: 1,
        flatType: 'FULL',
        status: 'AVAILABLE',
        price: 500000,
      },
    }),
    prisma.flat.create({
      data: {
        referenceNum: 'B1-F1-002',
        buildingId: building1.id,
        floorNum: 1,
        flatType: 'FULL',
        status: 'SOLD',
        price: 520000,
      },
    }),
    // Floor 2
    prisma.flat.create({
      data: {
        referenceNum: 'B1-F2-001',
        buildingId: building1.id,
        floorNum: 2,
        flatType: 'FULL',
        status: 'AVAILABLE',
        price: 550000,
      },
    }),
    prisma.flat.create({
      data: {
        referenceNum: 'B1-F2-002',
        buildingId: building1.id,
        floorNum: 2,
        flatType: 'FULL',
        status: 'RESERVED',
        price: 550000,
      },
    }),
    // Floor 3
    prisma.flat.create({
      data: {
        referenceNum: 'B1-F3-001',
        buildingId: building1.id,
        floorNum: 3,
        flatType: 'FULL',
        status: 'AVAILABLE',
        price: 600000,
      },
    }),
  ]);

  // Create Flats for Building 2
  const b2Flats = await Promise.all([
    // Floor 1
    prisma.flat.create({
      data: {
        referenceNum: 'B2-F1-001',
        buildingId: building2.id,
        floorNum: 1,
        flatType: 'FULL',
        status: 'AVAILABLE',
        price: 450000,
      },
    }),
    prisma.flat.create({
      data: {
        referenceNum: 'B2-F1-002',
        buildingId: building2.id,
        floorNum: 1,
        flatType: 'FULL',
        status: 'AVAILABLE',
        price: 450000,
      },
    }),
    // Floor 2
    prisma.flat.create({
      data: {
        referenceNum: 'B2-F2-001',
        buildingId: building2.id,
        floorNum: 2,
        flatType: 'FULL',
        status: 'SOLD',
        price: 480000,
      },
    }),
  ]);

  const totalFlats = b1Flats.length + b2Flats.length;
  console.log(`✅ Created ${totalFlats} flats across ${building1.totalFloors + building2.totalFloors} floors`);

  // Create Clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        fullName: 'أحمد بن محمد',
        phone: '+212612345678',
        cin: 'AB123456',
        address: 'الدار البيضاء',
        notes: 'عميل مهم',
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'فاطمة الزهراء',
        phone: '+212623456789',
        cin: 'CD789012',
        address: 'الرباط',
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'يوسف العلوي',
        phone: '+212634567890',
        cin: 'EF345678',
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'مريم السعدي',
        phone: '+212645678901',
      },
    }),
    prisma.client.create({
      data: {
        fullName: 'خالد الإدريسي',
        phone: '+212656789012',
        cin: 'GH901234',
        address: 'فاس',
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} clients`);

  // Create a Purchase
  const soldFlat = b1Flats.find(f => f.referenceNum === 'B1-F1-002')!;
  const purchase = await prisma.purchase.create({
    data: {
      clientId: clients[0].id,
      flatId: soldFlat.id,
      agreedPrice: 520000,
      status: 'IN_PROGRESS',
    },
  });

  console.log('✅ Created 1 purchase');

  // Create Payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        purchaseId: purchase.id,
        amount: 200000,
        receiptNum: 'RCP-2026-001',
        paymentDate: new Date('2026-01-10'),
      },
    }),
    prisma.payment.create({
      data: {
        purchaseId: purchase.id,
        amount: 120000,
        receiptNum: 'RCP-2026-002',
        paymentDate: new Date('2026-01-20'),
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = purchase.agreedPrice - totalPaid;

  console.log('✅ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Buildings: 2 (${building1.name}, ${building2.name})  `);
  console.log(`   - Clients: ${clients.length}`);
  console.log(`   - Flats: ${totalFlats} (Building 1: ${b1Flats.length}, Building 2: ${b2Flats.length})`);
  console.log(`   - Purchases: 1`);
  console.log(`   - Payments: ${payments.length}`);
  console.log(`   - Remaining on purchase: ${remaining.toLocaleString('ar-MA')} درهم\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
