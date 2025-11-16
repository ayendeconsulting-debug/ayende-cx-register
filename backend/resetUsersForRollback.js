import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    const password = "Admin123!";
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("Resetting all users to password: Admin123!\n");

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        business: {
          select: { businessName: true },
        },
      },
    });

    console.log(`Found ${users.length} users:\n`);

    // Reset all passwords
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: passwordHash,
          username: user.username.split(".")[0], // Remove subdomain if present
          isActive: true,
        },
      });

      console.log(
        `✅ ${user.business.businessName.padEnd(30)} | ${user.username.padEnd(
          20
        )} | ${user.role}`
      );
    }

    console.log("\n✅ All users reset successfully!");
    console.log("\nUniversal Password: Admin123!");
    console.log("Usernames: admin, cashier (without subdomain)\n");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetUsers();
