import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'superadmin@advanciapayledger.com';
  const newPassword = 'QAZwsxEDC1!?';

  console.log('🔐 Resetting password...\n');
  console.log(`Email: ${email}`);
  console.log(`New Password: ${newPassword}\n`);

  // Hash the password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update the user
  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      isApproved: true,
      isVerified: true,
      emailVerified: new Date(),
      approvedAt: new Date(),
    },
  });

  console.log('✅ Password reset successfully!');
  console.log('\n📋 Login credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}`);
  console.log(`   Login URL: https://advanciapayledger.com/auth/login`);

  await prisma.$disconnect();
}

resetPassword().catch(console.error);
