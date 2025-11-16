import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: "admin",
        business: { subdomain: "bashevents" },
      },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", user.username);
    console.log("Testing passwords:\n");

    // Test both possible passwords
    const passwords = ["Admin123!", "Admin2025!"];

    for (const pwd of passwords) {
      const isValid = await bcrypt.compare(pwd, user.passwordHash);
      console.log(
        `  ${pwd.padEnd(15)} → ${isValid ? "✅ CORRECT" : "❌ Wrong"}`
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
