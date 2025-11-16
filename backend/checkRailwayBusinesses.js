import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkBusinesses() {
  const businesses = await prisma.business.findMany({
    select: {
      businessName: true,
      subdomain: true,
      isActive: true,
    },
  });

  console.log("\n📋 PRODUCTION BUSINESSES:\n");
  businesses.forEach((b) => {
    console.log(
      `${b.businessName.padEnd(30)} | subdomain: ${
        b.subdomain || "NULL"
      } | active: ${b.isActive}`
    );
  });

  await prisma.$disconnect();
}

checkBusinesses();
