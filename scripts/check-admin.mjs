import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const user = await prisma.user.findUnique({ 
  where: { email: 'admin@advanciapayledger.com' } 
});

if (user) {
  console.log('✅ Admin user found');
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Password valid:', await bcrypt.compare('Admin@123456', user.password || ''));
} else {
  console.log('❌ Admin user not found');
}

await prisma.$disconnect();
