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

// Connection health check (non-blocking)
// Don't block startup if database is temporarily unavailable
prisma.$connect().catch((error) => {
  console.warn(
    '⚠️  Database connection warning:',
    error instanceof Error ? error.message : String(error)
  );
  // Don't exit in development - allow app to start
  // Database will be checked when actually needed
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_DB_CONNECTION === 'true') {
    // Only exit in production if explicitly required
    console.error('❌ Database connection required in production');
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
