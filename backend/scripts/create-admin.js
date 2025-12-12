#!/usr/bin/env node

/**
 * Create Admin User Script
 * Run: npm run seed:admin
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  console.log("\n🔐 CREATE ADMIN USER\n");

  try {
    const email = await question("Email: ");
    const password = await question("Password: ");
    const name = await question("Name (optional): ");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || undefined,
        role: "admin",
        is_verified: true,
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`\n🚀 Login at: http://localhost:3000/admin\n`);
  } catch (error) {
    if (error.code === "P2002") {
      console.error("\n❌ Error: User with this email already exists\n");
    } else {
      console.error("\n❌ Error creating admin:", error.message, "\n");
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
