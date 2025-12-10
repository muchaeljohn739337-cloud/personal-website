#!/usr/bin/env tsx
/**
 * Check if Admin User Exists
 * Verifies if an admin user is already created
 */

import { prisma } from '../lib/prismaClient';

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin users...\n');

    // Use raw query to avoid schema mismatch issues
    const admins = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        name: string | null;
        role: string;
        created_at: Date;
      }>
    >`
      SELECT id, email, name, role, created_at
      FROM "User"
      WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    `;

    if (admins.length === 0) {
      console.log('❌ No admin users found.\n');
      console.log('💡 To create an admin user, run:');
      console.log('   npm run create-admin\n');
      console.log('📋 Default credentials (if creating new):');
      console.log('   Email: admin@advanciapayledger.com');
      console.log('   Password: AdvanciaAdmin2024!Secure#\n');
      process.exit(1);
    }

    console.log(`✅ Found ${admins.length} admin user(s):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   Created: ${new Date(admin.created_at).toLocaleString()}\n`);
    });

    console.log('🔐 Login Information:');
    console.log(`   URL: http://localhost:3000/auth/login`);
    console.log(`   Email: ${admins[0].email}`);
    console.log(`   Password: [Set during admin creation]\n`);
    console.log('⚠️  If you forgot the password, create a new admin or reset via database.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin:', error);
    console.error('\n💡 This might be due to database connection issues.');
    console.error('   Check DATABASE_URL in your .env file.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
