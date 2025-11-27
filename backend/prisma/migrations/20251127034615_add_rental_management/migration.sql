-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENTAL', 'REFUND', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OVERDUE', 'PARTIALLY_RETURNED', 'RETURNED', 'CLOSED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdjustmentMovementType" ADD VALUE 'RENTAL_OUT';
ALTER TYPE "AdjustmentMovementType" ADD VALUE 'RENTAL_RETURN';

-- AlterEnum
ALTER TYPE "AdjustmentReason" ADD VALUE 'RENTAL_DAMAGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'RENTAL_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'RENTAL_RETURN';
ALTER TYPE "AuditAction" ADD VALUE 'RENTAL_CLOSE';

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'rental';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockMovementType" ADD VALUE 'RENTAL_OUT';
ALTER TYPE "StockMovementType" ADD VALUE 'RENTAL_RETURN';

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "defaultDepositPercent" DECIMAL(5,2) DEFAULT 25,
ADD COLUMN     "overdueGracePeriodDays" INTEGER DEFAULT 0,
ADD COLUMN     "rentalEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "isRental" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latePenaltyRate" DECIMAL(10,2),
ADD COLUMN     "maxRentalDuration" INTEGER,
ADD COLUMN     "minRentalDuration" INTEGER DEFAULT 1,
ADD COLUMN     "requiresDeposit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weeklyRate" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "transactionType" "TransactionType" NOT NULL DEFAULT 'SALE';

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "isRentalItem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rentalDays" INTEGER;

-- CreateTable
CREATE TABLE "rental_contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transactionId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedReturnDate" TIMESTAMP(3) NOT NULL,
    "actualReturnDate" TIMESTAMP(3),
    "rentalDays" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "depositAmount" DECIMAL(10,2) NOT NULL,
    "depositReturned" DECIMAL(10,2),
    "penaltyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "damageCharges" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDue" DECIMAL(10,2) NOT NULL,
    "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT '$',
    "currencyCode" TEXT NOT NULL DEFAULT 'CAD',
    "status" "RentalStatus" NOT NULL DEFAULT 'ACTIVE',
    "returnedBy" TEXT,
    "returnNotes" TEXT,
    "damageNotes" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "deliveryAddress" TEXT,
    "overdueNotified" BOOLEAN NOT NULL DEFAULT false,
    "overdueNotifiedAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "rental_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_contract_items" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "missingQuantity" INTEGER NOT NULL DEFAULT 0,
    "damageDescription" TEXT,
    "damageCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "rental_contract_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_transactionId_key" ON "rental_contracts"("transactionId");

-- CreateIndex
CREATE INDEX "rental_contracts_businessId_idx" ON "rental_contracts"("businessId");

-- CreateIndex
CREATE INDEX "rental_contracts_customerId_idx" ON "rental_contracts"("customerId");

-- CreateIndex
CREATE INDEX "rental_contracts_status_idx" ON "rental_contracts"("status");

-- CreateIndex
CREATE INDEX "rental_contracts_expectedReturnDate_idx" ON "rental_contracts"("expectedReturnDate");

-- CreateIndex
CREATE INDEX "rental_contracts_startDate_idx" ON "rental_contracts"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "rental_contracts_businessId_contractNumber_key" ON "rental_contracts"("businessId", "contractNumber");

-- CreateIndex
CREATE INDEX "rental_contract_items_contractId_idx" ON "rental_contract_items"("contractId");

-- CreateIndex
CREATE INDEX "rental_contract_items_productId_idx" ON "rental_contract_items"("productId");

-- CreateIndex
CREATE INDEX "Product_isRental_idx" ON "Product"("isRental");

-- CreateIndex
CREATE INDEX "Transaction_transactionType_idx" ON "Transaction"("transactionType");

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_returnedBy_fkey" FOREIGN KEY ("returnedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contract_items" ADD CONSTRAINT "rental_contract_items_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "rental_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_contract_items" ADD CONSTRAINT "rental_contract_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
