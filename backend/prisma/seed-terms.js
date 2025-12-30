import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTerms() {
  console.log("Seeding initial terms version...");

  // Check if terms already exist
  const existingTerms = await prisma.termsVersion.findFirst({
    where: { documentType: "COMBINED" },
  });

  if (existingTerms) {
    console.log("Terms already exist, skipping seed.");
    return existingTerms;
  }

  // Create initial combined terms version
  const terms = await prisma.termsVersion.create({
    data: {
      version: "1.0.0",
      documentType: "COMBINED",
      title: "Terms of Service and Privacy Policy",
      effectiveDate: new Date("2025-01-01"),
      contentUrl: "https://ayendecx.com/legal/terms",
      changelog: "Initial version",
      isActive: true,
    },
  });

  console.log("Created terms version:", terms.version);
  return terms;
}

seedTerms()
  .then(() => {
    console.log("Terms seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding terms:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
