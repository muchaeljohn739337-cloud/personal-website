const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifyEmail() {
  await prisma.user.update({
    where: { email: "admin@advancia.com" },
    data: { emailVerified: true },
  });
  console.log("✅ Email verified for admin@advancia.com");
  await prisma.$disconnect();
}

verifyEmail().catch((e) => {
  console.error(e);
  process.exit(1);
});
