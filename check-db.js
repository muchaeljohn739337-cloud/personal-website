const { PrismaClient } = require("@prisma/client");

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Checking database connection...");

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Check if uploaded_files table exists by trying to query it
    console.log("🔍 Checking for uploaded_files table...");

    try {
      const result =
        await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'uploaded_files'`;
      if (result && result.length > 0) {
        console.log("✅ uploaded_files table exists");

        // Get table structure
        const columns =
          await prisma.$queryRaw`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'uploaded_files' ORDER BY ordinal_position`;
        console.log("📋 Table structure:");
        columns.forEach((col) => {
          console.log(
            `  - ${col.column_name}: ${col.data_type} ${
              col.is_nullable === "YES" ? "(nullable)" : "(required)"
            }`
          );
        });

        // Count records
        const count =
          await prisma.$queryRaw`SELECT COUNT(*) as count FROM uploaded_files`;
        console.log(`📊 Records in table: ${count[0].count}`);
      } else {
        console.log("❌ uploaded_files table does not exist");
      }
    } catch (tableError) {
      console.log(
        "❌ Error checking uploaded_files table:",
        tableError.message
      );
    }

    // Check database info
    const dbInfo =
      await prisma.$queryRaw`SELECT current_database() as db_name, current_user as db_user`;
    console.log(`🗄️ Database: ${dbInfo[0].db_name}`);
    console.log(`👤 User: ${dbInfo[0].db_user}`);
  } catch (error) {
    console.log("❌ Database connection failed:", error.message);
    console.log("Full error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
