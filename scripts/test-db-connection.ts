import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Database query successful');
    console.log('Database info:', result);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
