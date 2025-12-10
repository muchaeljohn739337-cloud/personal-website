import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function approveAdmin() {
  console.log('🔧 Approving admin accounts...\n');

  // Approve both admin accounts
  await prisma.user.updateMany({
    where: {
      OR: [{ email: 'admin@advanciapayledger.com' }, { email: 'superadmin@advanciapayledger.com' }],
    },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      isVerified: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Approved admin accounts');

  // Verify
  const admins = await prisma.user.findMany({
    where: {
      OR: [{ email: 'admin@advanciapayledger.com' }, { email: 'superadmin@advanciapayledger.com' }],
    },
    select: {
      email: true,
      isApproved: true,
      isVerified: true,
    },
  });

  console.log('\n📋 Current status:');
  admins.forEach((admin) => {
    console.log(`   ${admin.email}: Approved=${admin.isApproved}, Verified=${admin.isVerified}`);
  });

  await prisma.$disconnect();
}

approveAdmin().catch(console.error);
