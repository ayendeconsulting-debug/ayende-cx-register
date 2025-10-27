/**
 * Create Test Business in POS Database
 * Run with: node create-business.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBusiness() {
  try {
    const business = await prisma.business.create({
      data: {
        businessName: "Ayende CX Test Store",
        businessAddress: "123 Main Street",
        businessCity: "Toronto",
        businessState: "Ontario",
        businessZipCode: "M5H 2N2",
        businessCountry: "Canada",
        businessPhone: "+1-416-555-0100",
        businessEmail: "info@ayendecx.com",
        currency: "CAD",
        currencyCode: "CAD",
        taxRate: 0.13,  // Ontario HST (13% as decimal)
        taxEnabled: true,
        isActive: true,
        primaryColor: "#4F46E5",
        secondaryColor: "#10B981",
      }
    });
    
    console.log("✓ Business created successfully!");
    console.log("Business ID:", business.id);
    console.log("Business Name:", business.businessName);
    console.log("\nThis ID will be used to map to CRM Tenant UUID: a-cx-d8bf4");
    
    return business;
  } catch (error) {
    console.error("Error creating business:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createBusiness()
  .then(() => {
    console.log("\n✓ Done! Check Prisma Studio to see the business record.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

  