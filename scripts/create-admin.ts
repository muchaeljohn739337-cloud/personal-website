/**
 * Create Admin User Script
 * Creates the first admin user and prevents admin lockout
 *
 * Usage: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('🔐 Admin User Creation\n');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${existingAdmin.email}`);
      const proceed = await question('Do you want to create another admin? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        process.exit(0);
      }
    }

    // Get admin details
    const email = await question('Email: ');
    const name = await question('Name (optional): ');
    const password = await question('Password: ');
    const role = (await question('Role (ADMIN/SUPER_ADMIN) [ADMIN]: ')) || 'ADMIN';

    if (!email || !password) {
      console.error('❌ Email and password are required');
      process.exit(1);
    }

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Role must be ADMIN or SUPER_ADMIN');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      const update = await question('Do you want to promote this user to admin? (y/n): ');

      if (update.toLowerCase() === 'y') {
        const hashedPassword = await hash(password, 12);
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: role as 'ADMIN' | 'SUPER_ADMIN',
            password: hashedPassword,
            isApproved: true, // Admins are auto-approved
            isVerified: true,
            approvedAt: new Date(),
            approvedBy: 'system',
          },
        });

        console.log(`✅ User ${updatedUser.email} promoted to ${role}`);
        console.log(`   User ID: ${updatedUser.id}`);
        process.exit(0);
      } else {
        console.log('Cancelled.');
        process.exit(0);
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name || null,
        password: hashedPassword,
        role: role as 'ADMIN' | 'SUPER_ADMIN',
        isApproved: true, // Admins are auto-approved
        isVerified: true,
        emailVerified: new Date(),
        approvedAt: new Date(),
        approvedBy: 'system',
      },
    });

    // Create default wallet
    await prisma.wallet.create({
      data: {
        name: 'Primary Wallet',
        userId: admin.id,
        type: 'PERSONAL',
        currency: 'USD',
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   User ID: ${admin.id}`);
    console.log(`   Approved: ${admin.isApproved}`);
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
