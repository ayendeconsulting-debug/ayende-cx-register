import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        business: {
          select: { businessName: true, subdomain: true },
        },
      },
      orderBy: { businessId: "asc" },
    });

    console.log("All users in database:\n");
    users.forEach((u) => {
      console.log(
        `Business: ${u.business.businessName.padEnd(30)} (${
          u.business.subdomain
        })`
      );
      console.log(`  Username: ${u.username}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Active: ${u.isActive}\n`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
