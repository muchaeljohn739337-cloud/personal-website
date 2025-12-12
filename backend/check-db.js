const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database...\n");

    // Check users
    const userCount = await prisma.users.count();
    const adminUsers = await prisma.users.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, username: true },
    });

    console.log(`📊 Total users: ${userCount}`);
    console.log(`👑 Admin users: ${adminUsers.length}`);
    if (adminUsers.length > 0) {
      console.log("   Admins:", adminUsers.map((u) => u.email || u.username).join(", "));
    }

    // Check blog data
    const categoryCount = await prisma.blogCategory.count();
    const postCount = await prisma.blogPost.count();

    console.log(`\n📝 Blog categories: ${categoryCount}`);
    console.log(`📰 Blog posts: ${postCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
