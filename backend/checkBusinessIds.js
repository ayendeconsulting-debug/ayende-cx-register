import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkBusinessIds() {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      businessName: true,
      subdomain: true,
    },
  });

  console.log("\n📋 BUSINESS IDs:\n");
  for (const business of businesses) {
    console.log(
      `${business.businessName.padEnd(30)} | ID: ${business.id} | subdomain: ${
        business.subdomain
      }`
    );

    const users = await prisma.user.findMany({
      where: { businessId: business.id },
      select: { username: true, businessId: true },
    });

    console.log(
      `  Users: ${users.map((u) => u.username).join(", ") || "NONE"}\n`
    );
  }

  await prisma.$disconnect();
}

checkBusinessIds();
