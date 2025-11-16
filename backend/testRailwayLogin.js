import prisma from "./src/config/database.js";
import bcrypt from "bcryptjs";

async function test() {
  try {
    // Generate correct hash
    const correctHash = await bcrypt.hash("Admin123!", 10);
    console.log("\n✅ CORRECT HASH FOR Admin123!:");
    console.log(correctHash);

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        business: { select: { businessName: true } },
      },
    });

    console.log("\n📋 ALL USERS IN RAILWAY DB:\n");
    for (const user of users) {
      const matches = await bcrypt.compare("Admin123!", user.passwordHash);
      console.log(
        `${user.business.businessName.padEnd(30)} | ${user.username.padEnd(
          15
        )} | Password OK: ${matches ? "✅" : "❌"}`
      );
    }

    console.log("\n🔧 TO FIX: Copy this hash and update manually in Railway:");
    console.log(correctHash);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
