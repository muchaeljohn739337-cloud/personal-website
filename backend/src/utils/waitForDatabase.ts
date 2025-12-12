import prisma from "../prismaClient";

export async function waitForDatabase(
  maxRetries = 10,
  delayMs = 3000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connection established");
      return;
    } catch (error) {
      console.warn(
        `⚠️  Database connection attempt ${
          i + 1
        }/${maxRetries} failed. Retrying in ${delayMs}ms...`
      );
      if (i === maxRetries - 1) {
        throw new Error(
          `Failed to connect to database after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
