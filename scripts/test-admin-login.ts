#!/usr/bin/env tsx
/**
 * Test Admin Login
 * Verifies admin credentials work correctly
 */

import { prisma } from '../lib/prismaClient';
import { compare } from 'bcryptjs';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing Admin Login...\n');

    const email = 'superadmin@advanciapayledger.com';
    const password = 'QAZwsxEDC1!?';

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isApproved: true,
        isVerified: true,
      },
    });

    if (!admin) {
      console.log('❌ Admin user not found!\n');
      console.log('💡 Create admin with: npm run create-admin\n');
      process.exit(1);
    }

    console.log('✅ Admin user found:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name || 'N/A'}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Approved: ${admin.isApproved ? 'Yes' : 'No'}`);
    console.log(`   Verified: ${admin.isVerified ? 'Yes' : 'No'}\n`);

    // Verify password
    if (admin.password) {
      const passwordValid = await compare(password, admin.password);
      if (passwordValid) {
        console.log('✅ Password is correct!\n');
        console.log('🔐 Login Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Login URL: http://localhost:3000/auth/login\n`);
        console.log('✅ Admin login test passed!\n');
      } else {
        console.log('❌ Password is incorrect!\n');
        console.log('💡 Reset password or create new admin\n');
        process.exit(1);
      }
    } else {
      console.log('⚠️  No password set for admin user\n');
      console.log('💡 Set password or create new admin\n');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();

