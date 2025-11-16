import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updatePasswords() {
  const hash = "$2a$10$qM3CHYrdwkLL8V4bblVuNe61uNreNK.1PG9St1wY5UFdrEpZo3X6S";

  const result = await prisma.user.updateMany({
    data: { passwordHash: hash },
  });

  console.log(`✅ Updated ${result.count} users with correct hash!`);
  await prisma.$disconnect();
}

updatePasswords();
