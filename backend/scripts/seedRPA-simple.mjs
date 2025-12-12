import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Looking for an admin user...");
  
  // Find any admin user to use as creator
  const adminUser = await prisma.user.findFirst({ 
    where: { role: "ADMIN" } 
  });
  
  if (!adminUser) {
    console.error("❌ No admin user found. Please create an admin user first.");
    process.exit(1);
  }
  
  console.log(`Using admin user: ${adminUser.email} (${adminUser.id})`);
  
  console.log("Creating RPA workflows...");
  const workflows = await Promise.all([
    prisma.rPAWorkflow.upsert({
      where: { id: "rpa-audit-sync" },
      update: {},
      create: {
        id: "rpa-audit-sync",
        name: "System Auto-Audit Sync",
        description: "Automated audit synchronization",
        trigger: { type: "schedule", cron: "0 * * * *" },
        actions: [{ type: "sync", target: "audit_logs" }],
        createdById: adminUser.id,
        enabled: true
      }
    }),
    prisma.rPAWorkflow.upsert({
      where: { id: "rpa-ledger-monitor" },
      update: {},
      create: {
        id: "rpa-ledger-monitor",
        name: "Ledger Health Monitor",
        description: "Monitor ledger health and consistency",
        trigger: { type: "schedule", cron: "*/15 * * * *" },
        actions: [{ type: "check", target: "ledger" }],
        createdById: adminUser.id,
        enabled: true
      }
    }),
    prisma.rPAWorkflow.upsert({
      where: { id: "rpa-daily-backup" },
      update: {},
      create: {
        id: "rpa-daily-backup",
        name: "Daily Backup Routine",
        description: "Automated daily database backup",
        trigger: { type: "schedule", cron: "0 2 * * *" },
        actions: [{ type: "backup", target: "database" }],
        createdById: adminUser.id,
        enabled: true
      }
    })
  ]);
  
  console.log(`✅ Successfully seeded ${workflows.length} RPA workflows`);
  workflows.forEach(w => console.log(`   - ${w.name} (${w.id})`));
}

main()
  .catch((e) => {
    console.error("❌ Error seeding RPA workflows:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
