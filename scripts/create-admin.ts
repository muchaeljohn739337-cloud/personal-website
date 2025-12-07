import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'admin@advanciapayledger.com';
  const password = 'Admin@123456'; // Change this after first login!
  const name = 'Admin User';

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Admin user already exists. Updating role to ADMIN...');
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      console.log('✅ User role updated to ADMIN');
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    // Create default wallet for admin
    await prisma.wallet.create({
      data: {
        name: 'Primary Wallet',
        userId: user.id,
        type: 'PERSONAL',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
