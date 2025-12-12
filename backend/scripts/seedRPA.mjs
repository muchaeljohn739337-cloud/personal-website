import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create a system user if it doesn't exist
  let systemUser = await prisma.user.findFirst({ where: { email: "system@advancia.com" } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: "system@advancia.com",
        username: "system",
        passwordHash: "system",
        role: "ADMIN",
      },
    });
  }

  await prisma.rPAWorkflow.createMany({
    data: [
      { 
        name: "System Auto-Audit Sync", 
        description: "Automated audit synchronization", 
        trigger: { type: "schedule", cron: "0 * * * *" }, 
        actions: [{ type: "sync", target: "audit_logs" }], 
        createdById: systemUser.id 
      },
      { 
        name: "Ledger Health Monitor", 
        description: "Monitor ledger health and consistency", 
        trigger: { type: "schedule", cron: "*/15 * * * *" }, 
        actions: [{ type: "check", target: "ledger" }], 
        createdById: systemUser.id 
      },
      { 
        name: "Daily Backup Routine", 
        description: "Automated daily database backup", 
        trigger: { type: "schedule", cron: "0 2 * * *" }, 
        actions: [{ type: "backup", target: "database" }], 
        createdById: systemUser.id 
      }
    ],
    skipDuplicates: true
  });
  console.log("✅ Default RPA workflows seeded successfully");
}

main()
  .catch((e) => {
    console.error("Error seeding RPA workflows:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
