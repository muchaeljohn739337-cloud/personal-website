import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with connection pooling and error handling
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

// Connection health check
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  if (process.env.NODE_ENV === 'production') {
    // In production, we might want to exit or retry
    process.exit(1);
  }
});

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
