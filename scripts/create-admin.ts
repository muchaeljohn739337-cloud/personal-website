import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@advanciapayledger.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456'; // ⚠️ Use ADMIN_PASSWORD env var in production!
  const name = process.env.ADMIN_NAME || 'Admin User';

  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: ADMIN_PASSWORD environment variable must be set in production!');
    process.exit(1);
  }

  try {
    // Hash password
    const hashedPassword = await hash(password, 12);

    // Upsert admin user (create or update)
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin user created/updated successfully!');
    console.log('');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', user.id);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
