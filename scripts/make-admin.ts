/**
 * Script to promote a user to admin or super admin role
 * Usage: npx ts-node scripts/make-admin.ts <email> [--super]
 */

import { PrismaClient } from '@prisma/client';

// Use Supabase database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres.xesecqcqzykvmrtxrzqi:1j4wUXLfkSxe2Zds@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    },
  },
});

async function makeAdmin(email: string, isSuperAdmin: boolean) {
  try {
    const role = isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';
    
    const user = await prisma.user.update({
      where: { email },
      data: { role },
    });

    console.log(`✅ User ${user.email} is now a ${role}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log('');
    console.log('Access granted:');
    if (isSuperAdmin) {
      console.log('   ✓ All admin features');
      console.log('   ✓ User deletion');
      console.log('   ✓ Billing refunds');
      console.log('   ✓ System maintenance mode');
      console.log('   ✓ Feature toggles');
      console.log('   ✓ AI model management');
    } else {
      console.log('   ✓ User management');
      console.log('   ✓ View logs');
      console.log('   ✓ Content moderation');
      console.log('   ✓ View billing');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const isSuperAdmin = process.argv.includes('--super');

if (!email) {
  console.log('Usage:');
  console.log('  npx ts-node scripts/make-admin.ts <email>         # Make ADMIN');
  console.log('  npx ts-node scripts/make-admin.ts <email> --super # Make SUPER_ADMIN');
  console.log('');
  console.log('Example:');
  console.log('  npx ts-node scripts/make-admin.ts admin@example.com --super');
  process.exit(1);
}

makeAdmin(email, isSuperAdmin);
