import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkPasswords() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      passwordHash: true,
      business: {
        select: {
          businessName: true,
          subdomain: true,
        },
      },
    },
  });

  console.log("\n📋 PASSWORD HASH CHECK:\n");

  for (const user of users) {
    const isValid = await bcrypt.compare("Admin123!", user.passwordHash);
    const hashPreview = user.passwordHash.substring(0, 20);
    const hashLength = user.passwordHash.length;

    console.log(
      `${user.business.businessName.padEnd(30)} | ${user.username.padEnd(
        10
      )} | Hash: ${hashPreview}... (${hashLength} chars) | Valid: ${
        isValid ? "✅" : "❌"
      }`
    );
  }

  await prisma.$disconnect();
}

checkPasswords();
