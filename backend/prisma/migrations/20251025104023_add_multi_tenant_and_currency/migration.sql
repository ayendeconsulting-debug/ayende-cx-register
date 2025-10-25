/*
  Warnings:

  - A unique constraint covering the columns `[businessId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,shiftNumber]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,transactionNumber]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,adjustmentNumber]` on the table `stock_adjustments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `LoyaltyTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Customer_phone_key";

-- DropIndex
DROP INDEX "Product_barcode_key";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Shift_shiftNumber_key";

-- DropIndex
DROP INDEX "Transaction_transactionNumber_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_username_key";

-- DropIndex
DROP INDEX "stock_adjustments_adjustmentNumber_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LoyaltyTransaction" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT '$',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT '$',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT '$',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_adjustments" ADD COLUMN     "businessId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "externalTenantId" TEXT,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT,
    "businessCity" TEXT,
    "businessState" TEXT,
    "businessZipCode" TEXT,
    "businessCountry" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessWebsite" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#10B981',
    "currency" TEXT NOT NULL DEFAULT '$',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '12',
    "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    "taxLabel" TEXT NOT NULL DEFAULT 'Tax',
    "taxNumber" TEXT,
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionTier" TEXT DEFAULT 'BASIC',
    "subscriptionExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_externalTenantId_key" ON "Business"("externalTenantId");

-- CreateIndex
CREATE INDEX "Business_externalTenantId_idx" ON "Business"("externalTenantId");

-- CreateIndex
CREATE INDEX "Business_businessName_idx" ON "Business"("businessName");

-- CreateIndex
CREATE INDEX "Category_businessId_idx" ON "Category"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_businessId_name_key" ON "Category"("businessId", "name");

-- CreateIndex
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_email_key" ON "Customer"("businessId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_phone_key" ON "Customer"("businessId", "phone");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_businessId_idx" ON "LoyaltyTransaction"("businessId");

-- CreateIndex
CREATE INDEX "Product_businessId_idx" ON "Product"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_sku_key" ON "Product"("businessId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_barcode_key" ON "Product"("businessId", "barcode");

-- CreateIndex
CREATE INDEX "Shift_businessId_idx" ON "Shift"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_businessId_shiftNumber_key" ON "Shift"("businessId", "shiftNumber");

-- CreateIndex
CREATE INDEX "Transaction_businessId_idx" ON "Transaction"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_businessId_transactionNumber_key" ON "Transaction"("businessId", "transactionNumber");

-- CreateIndex
CREATE INDEX "User_businessId_idx" ON "User"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "User_businessId_email_key" ON "User"("businessId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "User_businessId_username_key" ON "User"("businessId", "username");

-- CreateIndex
CREATE INDEX "stock_adjustments_businessId_idx" ON "stock_adjustments"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_adjustments_businessId_adjustmentNumber_key" ON "stock_adjustments"("businessId", "adjustmentNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
