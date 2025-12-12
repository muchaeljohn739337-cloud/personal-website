import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global prisma in development to prevent hot-reload multiple clients
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// For SQLite in Prisma 7, URL comes from prisma.config.ts
const prisma =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;
export type { PrismaClient };

// CommonJS compatibility for JavaScript files
module.exports = prisma;
module.exports.default = prisma;
