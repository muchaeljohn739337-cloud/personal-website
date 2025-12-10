import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmins() {
  console.log('🔍 Checking admin users...\n');

  const admins = await prisma.user.findMany({
    where: {
      OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      password: true,
      createdAt: true,
    },
  });

  if (admins.length === 0) {
    console.log('❌ No admin users found!');
  } else {
    console.log(`✅ Found ${admins.length} admin user(s):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Approved: ${admin.isApproved}`);
      console.log(`   Has Password: ${!!admin.password}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkAdmins().catch(console.error);
