/*
  Warnings:

  - The values [CARD,LOYALTY_POINTS,SPLIT,MOBILE] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [REFUND,EXCHANGE] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `businessAddress` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessCity` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessCountry` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessEmail` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessPhone` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessState` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessWebsite` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessZipCode` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `currencyCode` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `currencyPosition` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `dateFormat` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `decimalPlaces` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `decimalSeparator` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `defaultDepositPercent` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyEnabled` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `overdueGracePeriodDays` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `receiptFooter` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `receiptHeader` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `rentalEnabled` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionExpiry` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionTier` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `syncStatus` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `taxEnabled` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `taxLabel` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `taxNumber` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `thousandsSeparator` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `timeFormat` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `LoyaltyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `currencyCode` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `dailyRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isRental` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isTaxable` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `latePenaltyRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `lowStockAlert` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPoints` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `maxRentalDuration` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `minRentalDuration` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `requiresDeposit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stockQuantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyRate` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaid` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `changeGiven` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `currencyCode` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsEarned` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsRedeemed` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `shiftId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `syncError` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `syncStatus` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `syncedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `syncedToCRM` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `syncedToCrm` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `transactionNumber` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `transactionType` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `voidReason` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoyaltyReconciliation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncQueue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemMapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserInvitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rental_contract_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rental_contracts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_adjustment_approvals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_adjustments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_movement_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `terms_acceptances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `terms_versions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[business_id,sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_email` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_name` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Made the column `subdomain` on table `Business` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `customer_id` to the `LoyaltyTransaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `LoyaltyTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `business_id` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RETAIL', 'RENTAL', 'SERVICE', 'HOSPITALITY');

-- CreateEnum
CREATE TYPE "CustomerAccountType" AS ENUM ('PERSON', 'BUSINESS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'REFUNDED', 'FORFEITED', 'APPLIED');

-- CreateEnum
CREATE TYPE "ServiceEngagementType" AS ENUM ('HOURLY', 'FIXED', 'RETAINER', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "HospitalityServiceType" AS ENUM ('DINE_IN', 'TAKEOUT', 'DELIVERY', 'CATERING');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('CUSTOMER_REQUEST', 'DAMAGED_PRODUCT', 'WRONG_ITEM', 'DEFECTIVE', 'CANCELLED_SERVICE', 'LATE_RETURN', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'SERVER', 'KITCHEN', 'TECHNICIAN', 'SALES_REP', 'RENTAL_AGENT');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('NONE', 'VIEW', 'CREATE', 'EDIT', 'DELETE', 'FULL');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER');
ALTER TABLE "Payment" ALTER COLUMN "payment_method" TYPE "PaymentMethod_new" USING ("payment_method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('SALE', 'RENTAL', 'SERVICE', 'HOSPITALITY');
ALTER TABLE "Transaction" ALTER COLUMN "transactionType" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "transaction_type" TYPE "TransactionType_new" USING ("transaction_type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_businessId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyReconciliation" DROP CONSTRAINT "LoyaltyReconciliation_businessId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyReconciliation" DROP CONSTRAINT "LoyaltyReconciliation_customerId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyTransaction" DROP CONSTRAINT "LoyaltyTransaction_businessId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyTransaction" DROP CONSTRAINT "LoyaltyTransaction_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_userId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "SyncQueue" DROP CONSTRAINT "SyncQueue_businessId_fkey";

-- DropForeignKey
ALTER TABLE "SystemMapping" DROP CONSTRAINT "SystemMapping_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_shiftId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionItem" DROP CONSTRAINT "TransactionItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionItem" DROP CONSTRAINT "TransactionItem_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_businessId_fkey";

-- DropForeignKey
ALTER TABLE "UserInvitation" DROP CONSTRAINT "UserInvitation_businessId_fkey";

-- DropForeignKey
ALTER TABLE "UserInvitation" DROP CONSTRAINT "UserInvitation_invitedBy_fkey";

-- DropForeignKey
ALTER TABLE "rental_contract_items" DROP CONSTRAINT "rental_contract_items_contractId_fkey";

-- DropForeignKey
ALTER TABLE "rental_contract_items" DROP CONSTRAINT "rental_contract_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "rental_contracts" DROP CONSTRAINT "rental_contracts_businessId_fkey";

-- DropForeignKey
ALTER TABLE "rental_contracts" DROP CONSTRAINT "rental_contracts_customerId_fkey";

-- DropForeignKey
ALTER TABLE "rental_contracts" DROP CONSTRAINT "rental_contracts_returnedBy_fkey";

-- DropForeignKey
ALTER TABLE "rental_contracts" DROP CONSTRAINT "rental_contracts_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustment_approvals" DROP CONSTRAINT "stock_adjustment_approvals_adjustmentId_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustment_approvals" DROP CONSTRAINT "stock_adjustment_approvals_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_businessId_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_productId_fkey";

-- DropForeignKey
ALTER TABLE "stock_movement_history" DROP CONSTRAINT "stock_movement_history_adjustmentId_fkey";

-- DropForeignKey
ALTER TABLE "stock_movement_history" DROP CONSTRAINT "stock_movement_history_performedBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_movement_history" DROP CONSTRAINT "stock_movement_history_productId_fkey";

-- DropForeignKey
ALTER TABLE "sync_logs" DROP CONSTRAINT "sync_logs_businessId_fkey";

-- DropForeignKey
ALTER TABLE "terms_acceptances" DROP CONSTRAINT "terms_acceptances_businessId_fkey";

-- DropForeignKey
ALTER TABLE "terms_acceptances" DROP CONSTRAINT "terms_acceptances_termsVersionId_fkey";

-- DropIndex
DROP INDEX "Business_businessName_idx";

-- DropIndex
DROP INDEX "Business_externalTenantId_idx";

-- DropIndex
DROP INDEX "LoyaltyTransaction_businessId_idx";

-- DropIndex
DROP INDEX "LoyaltyTransaction_createdAt_idx";

-- DropIndex
DROP INDEX "LoyaltyTransaction_customerId_idx";

-- DropIndex
DROP INDEX "Product_barcode_idx";

-- DropIndex
DROP INDEX "Product_businessId_barcode_key";

-- DropIndex
DROP INDEX "Product_businessId_idx";

-- DropIndex
DROP INDEX "Product_businessId_sku_key";

-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- DropIndex
DROP INDEX "Product_isRental_idx";

-- DropIndex
DROP INDEX "Product_sku_idx";

-- DropIndex
DROP INDEX "Transaction_businessId_idx";

-- DropIndex
DROP INDEX "Transaction_businessId_transactionNumber_key";

-- DropIndex
DROP INDEX "Transaction_createdAt_idx";

-- DropIndex
DROP INDEX "Transaction_customerId_idx";

-- DropIndex
DROP INDEX "Transaction_externalId_idx";

-- DropIndex
DROP INDEX "Transaction_shiftId_idx";

-- DropIndex
DROP INDEX "Transaction_status_idx";

-- DropIndex
DROP INDEX "Transaction_syncedToCRM_idx";

-- DropIndex
DROP INDEX "Transaction_syncedToCrm_idx";

-- DropIndex
DROP INDEX "Transaction_transactionType_idx";

-- DropIndex
DROP INDEX "Transaction_userId_idx";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "businessAddress",
DROP COLUMN "businessCity",
DROP COLUMN "businessCountry",
DROP COLUMN "businessEmail",
DROP COLUMN "businessName",
DROP COLUMN "businessPhone",
DROP COLUMN "businessState",
DROP COLUMN "businessWebsite",
DROP COLUMN "businessZipCode",
DROP COLUMN "currency",
DROP COLUMN "currencyCode",
DROP COLUMN "currencyPosition",
DROP COLUMN "dateFormat",
DROP COLUMN "decimalPlaces",
DROP COLUMN "decimalSeparator",
DROP COLUMN "defaultDepositPercent",
DROP COLUMN "isActive",
DROP COLUMN "lastSyncedAt",
DROP COLUMN "logoUrl",
DROP COLUMN "loyaltyEnabled",
DROP COLUMN "overdueGracePeriodDays",
DROP COLUMN "primaryColor",
DROP COLUMN "receiptFooter",
DROP COLUMN "receiptHeader",
DROP COLUMN "rentalEnabled",
DROP COLUMN "secondaryColor",
DROP COLUMN "subscriptionExpiry",
DROP COLUMN "subscriptionTier",
DROP COLUMN "syncStatus",
DROP COLUMN "taxEnabled",
DROP COLUMN "taxLabel",
DROP COLUMN "taxNumber",
DROP COLUMN "taxRate",
DROP COLUMN "thousandsSeparator",
DROP COLUMN "timeFormat",
DROP COLUMN "timezone",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "business_type" "BusinessType" NOT NULL DEFAULT 'RETAIL',
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "owner_email" TEXT NOT NULL,
ADD COLUMN     "owner_name" TEXT NOT NULL,
ADD COLUMN     "owner_phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "primary_color" TEXT DEFAULT '#10B981',
ADD COLUMN     "secondary_color" TEXT DEFAULT '#059669',
ADD COLUMN     "state" TEXT,
ADD COLUMN     "subscription_tier" TEXT DEFAULT 'starter',
ADD COLUMN     "trial_ends_at" TIMESTAMP(3),
ALTER COLUMN "subdomain" SET NOT NULL;

-- AlterTable
ALTER TABLE "LoyaltyTransaction" DROP COLUMN "businessId",
DROP COLUMN "customerId",
DROP COLUMN "description",
DROP COLUMN "expiresAt",
DROP COLUMN "points",
DROP COLUMN "transactionId",
ADD COLUMN     "customer_id" TEXT NOT NULL,
ADD COLUMN     "points_balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "points_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "points_redeemed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "transaction_id" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "businessId",
DROP COLUMN "categoryId",
DROP COLUMN "costPrice",
DROP COLUMN "currency",
DROP COLUMN "currencyCode",
DROP COLUMN "dailyRate",
DROP COLUMN "depositAmount",
DROP COLUMN "hourlyRate",
DROP COLUMN "imageUrl",
DROP COLUMN "isActive",
DROP COLUMN "isRental",
DROP COLUMN "isTaxable",
DROP COLUMN "latePenaltyRate",
DROP COLUMN "lowStockAlert",
DROP COLUMN "loyaltyPoints",
DROP COLUMN "maxRentalDuration",
DROP COLUMN "minRentalDuration",
DROP COLUMN "requiresDeposit",
DROP COLUMN "stockQuantity",
DROP COLUMN "weeklyRate",
ADD COLUMN     "business_id" TEXT NOT NULL,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "cost_price" DECIMAL(10,2),
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_taxable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "low_stock_alert" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "loyalty_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amountPaid",
DROP COLUMN "businessId",
DROP COLUMN "changeGiven",
DROP COLUMN "currencyCode",
DROP COLUMN "customerId",
DROP COLUMN "discountAmount",
DROP COLUMN "externalId",
DROP COLUMN "lastSyncedAt",
DROP COLUMN "loyaltyPointsEarned",
DROP COLUMN "loyaltyPointsRedeemed",
DROP COLUMN "paymentMethod",
DROP COLUMN "shiftId",
DROP COLUMN "status",
DROP COLUMN "syncError",
DROP COLUMN "syncStatus",
DROP COLUMN "syncedAt",
DROP COLUMN "syncedToCRM",
DROP COLUMN "syncedToCrm",
DROP COLUMN "taxAmount",
DROP COLUMN "total",
DROP COLUMN "transactionNumber",
DROP COLUMN "transactionType",
DROP COLUMN "userId",
DROP COLUMN "voidReason",
ADD COLUMN     "amount_due" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "business_id" TEXT NOT NULL,
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "is_walk_in" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyalty_points_redeemed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "processed_by" TEXT,
ADD COLUMN     "synced_at" TIMESTAMP(3),
ADD COLUMN     "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "transaction_type" "TransactionType" NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'NGN';

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Customer";

-- DropTable
DROP TABLE "LoyaltyReconciliation";

-- DropTable
DROP TABLE "Shift";

-- DropTable
DROP TABLE "StockMovement";

-- DropTable
DROP TABLE "SyncQueue";

-- DropTable
DROP TABLE "SystemConfig";

-- DropTable
DROP TABLE "SystemMapping";

-- DropTable
DROP TABLE "TransactionItem";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserInvitation";

-- DropTable
DROP TABLE "rental_contract_items";

-- DropTable
DROP TABLE "rental_contracts";

-- DropTable
DROP TABLE "stock_adjustment_approvals";

-- DropTable
DROP TABLE "stock_adjustments";

-- DropTable
DROP TABLE "stock_movement_history";

-- DropTable
DROP TABLE "sync_logs";

-- DropTable
DROP TABLE "terms_acceptances";

-- DropTable
DROP TABLE "terms_versions";

-- DropEnum
DROP TYPE "AdjustmentMovementType";

-- DropEnum
DROP TYPE "AdjustmentReason";

-- DropEnum
DROP TYPE "AdjustmentStatus";

-- DropEnum
DROP TYPE "AdjustmentType";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "AuditAction";

-- DropEnum
DROP TYPE "CustomerSource";

-- DropEnum
DROP TYPE "CustomerSyncState";

-- DropEnum
DROP TYPE "EntityMappingType";

-- DropEnum
DROP TYPE "EntityType";

-- DropEnum
DROP TYPE "InvitationStatus";

-- DropEnum
DROP TYPE "LoyaltyTransactionType";

-- DropEnum
DROP TYPE "QueueStatus";

-- DropEnum
DROP TYPE "RentalStatus";

-- DropEnum
DROP TYPE "ShiftStatus";

-- DropEnum
DROP TYPE "StockMovementType";

-- DropEnum
DROP TYPE "SyncPriority";

-- DropEnum
DROP TYPE "SyncStatus";

-- DropEnum
DROP TYPE "TermsDocumentType";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "BusinessConfig" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "inventory_enabled" BOOLEAN NOT NULL DEFAULT false,
    "barcode_scanning" BOOLEAN NOT NULL DEFAULT false,
    "stock_alerts" BOOLEAN NOT NULL DEFAULT false,
    "low_stock_threshold" INTEGER DEFAULT 10,
    "rental_contracts" BOOLEAN NOT NULL DEFAULT false,
    "deposit_management" BOOLEAN NOT NULL DEFAULT false,
    "late_fee_enabled" BOOLEAN NOT NULL DEFAULT false,
    "late_fee_per_day" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "damage_fee_enabled" BOOLEAN NOT NULL DEFAULT false,
    "appointment_booking" BOOLEAN NOT NULL DEFAULT false,
    "staff_commissions" BOOLEAN NOT NULL DEFAULT false,
    "commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "time_tracking" BOOLEAN NOT NULL DEFAULT false,
    "table_management" BOOLEAN NOT NULL DEFAULT false,
    "kitchen_display" BOOLEAN NOT NULL DEFAULT false,
    "tips_enabled" BOOLEAN NOT NULL DEFAULT true,
    "split_bill_enabled" BOOLEAN NOT NULL DEFAULT true,
    "loyalty_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_receipts" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "multi_currency_enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_currency" TEXT NOT NULL DEFAULT 'NGN',
    "supported_currencies" TEXT[] DEFAULT ARRAY['NGN']::TEXT[],
    "partial_payments_enabled" BOOLEAN NOT NULL DEFAULT false,
    "min_deposit_percent" DECIMAL(5,2) DEFAULT 0,
    "tax_enabled" BOOLEAN NOT NULL DEFAULT true,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_exempt_services" BOOLEAN NOT NULL DEFAULT false,
    "refund_enabled" BOOLEAN NOT NULL DEFAULT true,
    "refund_restocking_fee" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "refund_window_days" INTEGER DEFAULT 30,
    "min_order_enabled" BOOLEAN NOT NULL DEFAULT false,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "offline_mode_enabled" BOOLEAN NOT NULL DEFAULT true,
    "offline_sync_interval" INTEGER DEFAULT 300,
    "color_theme" TEXT,
    "dashboard_widgets" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCustomer" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "account_type" "CustomerAccountType" NOT NULL DEFAULT 'PERSON',
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "business_name" TEXT,
    "business_reg_no" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "contact_person_name" TEXT,
    "contact_person_title" TEXT,
    "contact_person_phone" TEXT,
    "contact_person_email" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "loyalty_points_balance" INTEGER NOT NULL DEFAULT 0,
    "loyalty_tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
    "total_lifetime_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "last_visit" TIMESTAMP(3),
    "member_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credit_limit" DECIMAL(10,2),
    "payment_terms" TEXT DEFAULT 'IMMEDIATE',
    "outstanding_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "tax_exempt_cert" TEXT,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "preferred_contact_method" TEXT DEFAULT 'email',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "external_id" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'CASHIER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPermission" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "transaction_create" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "transaction_void" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "transaction_refund" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "rental_checkout" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "rental_checkin" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "rental_extend" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "inventory_view" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "inventory_adjust" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "customer_create" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "customer_edit" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "reports_view" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "settings_manage" "PermissionLevel" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "daily_rate" DECIMAL(10,2),
    "hourly_rate" DECIMAL(10,2),
    "weekly_rate" DECIMAL(10,2),
    "deposit_required" BOOLEAN NOT NULL DEFAULT true,
    "deposit_amount" DECIMAL(10,2),
    "quantity_total" INTEGER NOT NULL DEFAULT 1,
    "quantity_available" INTEGER NOT NULL DEFAULT 1,
    "min_rental_days" INTEGER DEFAULT 1,
    "max_rental_days" INTEGER,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "hourly_rate" DECIMAL(10,2),
    "fixed_price" DECIMAL(10,2),
    "estimated_duration" INTEGER,
    "requires_staff" BOOLEAN NOT NULL DEFAULT false,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "prep_time" INTEGER,
    "available_quantity" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "allergens" TEXT,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "rental_start" TIMESTAMP(3) NOT NULL,
    "rental_end" TIMESTAMP(3) NOT NULL,
    "actual_return" TIMESTAMP(3),
    "deposit_amount" DECIMAL(10,2) NOT NULL,
    "deposit_status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "late_fee_per_day" DECIMAL(10,2) DEFAULT 0,
    "late_fee_charged" DECIMAL(10,2) DEFAULT 0,
    "damage_fee" DECIMAL(10,2) DEFAULT 0,
    "damage_notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "duration_hours" DECIMAL(5,2),
    "project_name" TEXT,
    "engagement_type" "ServiceEngagementType",
    "commission_enabled" BOOLEAN NOT NULL DEFAULT false,
    "commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalityTransaction" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "table_number" TEXT,
    "server_id" TEXT,
    "service_type" "HospitalityServiceType",
    "guest_count" INTEGER,
    "order_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "served_time" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalityTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLineItem" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) DEFAULT 0,
    "discount_amount" DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "equipment_name" TEXT NOT NULL,
    "rental_period_days" INTEGER NOT NULL,
    "daily_rate" DECIMAL(10,2) NOT NULL,
    "total_rental_fee" DECIMAL(10,2) NOT NULL,
    "condition_out" TEXT,
    "condition_in" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_category" TEXT,
    "hours" DECIMAL(5,2),
    "hourly_rate" DECIMAL(10,2),
    "fixed_fee" DECIMAL(10,2),
    "line_total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalityLineItem" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "menu_item_name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "special_requests" TEXT,
    "modifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalityLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "payment_method" "PaymentMethod" NOT NULL,
    "exchange_rate" DECIMAL(10,6) DEFAULT 1,
    "amount_in_base_currency" DECIMAL(10,2),
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "restocking_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_refund" DECIMAL(10,2) NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "refund_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAssignment" (
    "id" TEXT NOT NULL,
    "service_transaction_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "hours_worked" DECIMAL(5,2),
    "commission_earned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "points_calculation_method" TEXT NOT NULL DEFAULT 'per_dollar',
    "points_per_dollar" DECIMAL(5,2) DEFAULT 1,
    "points_per_session" INTEGER DEFAULT 10,
    "points_per_transaction" INTEGER DEFAULT 5,
    "redemption_value" DECIMAL(10,4) NOT NULL DEFAULT 0.01,
    "min_points_redemption" INTEGER NOT NULL DEFAULT 100,
    "bronze_threshold" INTEGER NOT NULL DEFAULT 0,
    "silver_threshold" INTEGER NOT NULL DEFAULT 500,
    "gold_threshold" INTEGER NOT NULL DEFAULT 1000,
    "platinum_threshold" INTEGER NOT NULL DEFAULT 2500,
    "tier_benefits" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "contentUrl" TEXT,
    "changelog" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "termsVersionId" TEXT NOT NULL,
    "acceptedBy" TEXT,
    "acceptedByEmail" TEXT NOT NULL,
    "acceptedByName" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessConfig_business_id_key" ON "BusinessConfig"("business_id");

-- CreateIndex
CREATE INDEX "TenantCustomer_tenant_id_idx" ON "TenantCustomer"("tenant_id");

-- CreateIndex
CREATE INDEX "TenantCustomer_email_idx" ON "TenantCustomer"("email");

-- CreateIndex
CREATE INDEX "TenantCustomer_phone_idx" ON "TenantCustomer"("phone");

-- CreateIndex
CREATE INDEX "TenantCustomer_loyalty_tier_idx" ON "TenantCustomer"("loyalty_tier");

-- CreateIndex
CREATE INDEX "TenantCustomer_account_type_idx" ON "TenantCustomer"("account_type");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCustomer_tenant_id_email_key" ON "TenantCustomer"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCustomer_tenant_id_phone_key" ON "TenantCustomer"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "Staff_business_id_idx" ON "Staff"("business_id");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_business_id_email_key" ON "Staff"("business_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_business_id_username_key" ON "Staff"("business_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPermission_staff_id_key" ON "StaffPermission"("staff_id");

-- CreateIndex
CREATE INDEX "Equipment_business_id_idx" ON "Equipment"("business_id");

-- CreateIndex
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_business_id_sku_key" ON "Equipment"("business_id", "sku");

-- CreateIndex
CREATE INDEX "Service_business_id_idx" ON "Service"("business_id");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "MenuItem_business_id_idx" ON "MenuItem"("business_id");

-- CreateIndex
CREATE INDEX "MenuItem_category_idx" ON "MenuItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SaleTransaction_transaction_id_key" ON "SaleTransaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "SaleTransaction_receipt_number_key" ON "SaleTransaction"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "RentalTransaction_transaction_id_key" ON "RentalTransaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "RentalTransaction_contract_number_key" ON "RentalTransaction"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTransaction_transaction_id_key" ON "ServiceTransaction"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalityTransaction_transaction_id_key" ON "HospitalityTransaction"("transaction_id");

-- CreateIndex
CREATE INDEX "TransactionLineItem_transaction_id_idx" ON "TransactionLineItem"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "SaleLineItem_line_item_id_key" ON "SaleLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "RentalLineItem_line_item_id_key" ON "RentalLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLineItem_line_item_id_key" ON "ServiceLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalityLineItem_line_item_id_key" ON "HospitalityLineItem"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_transaction_id_idx" ON "Payment"("transaction_id");

-- CreateIndex
CREATE INDEX "Refund_transaction_id_idx" ON "Refund"("transaction_id");

-- CreateIndex
CREATE INDEX "ServiceAssignment_service_transaction_id_idx" ON "ServiceAssignment"("service_transaction_id");

-- CreateIndex
CREATE INDEX "ServiceAssignment_staff_id_idx" ON "ServiceAssignment"("staff_id");

-- CreateIndex
CREATE INDEX "Appointment_customer_id_idx" ON "Appointment"("customer_id");

-- CreateIndex
CREATE INDEX "Appointment_appointment_date_idx" ON "Appointment"("appointment_date");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_business_id_key" ON "LoyaltyProgram"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TermsVersion_version_key" ON "TermsVersion"("version");

-- CreateIndex
CREATE INDEX "Business_subdomain_idx" ON "Business"("subdomain");

-- CreateIndex
CREATE INDEX "Business_business_type_idx" ON "Business"("business_type");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_customer_id_idx" ON "LoyaltyTransaction"("customer_id");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_transaction_date_idx" ON "LoyaltyTransaction"("transaction_date");

-- CreateIndex
CREATE INDEX "Product_business_id_idx" ON "Product"("business_id");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Product_business_id_sku_key" ON "Product"("business_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_business_id_barcode_key" ON "Product"("business_id", "barcode");

-- CreateIndex
CREATE INDEX "Transaction_business_id_idx" ON "Transaction"("business_id");

-- CreateIndex
CREATE INDEX "Transaction_customer_id_idx" ON "Transaction"("customer_id");

-- CreateIndex
CREATE INDEX "Transaction_transaction_type_idx" ON "Transaction"("transaction_type");

-- CreateIndex
CREATE INDEX "Transaction_transaction_date_idx" ON "Transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "Transaction_payment_status_idx" ON "Transaction"("payment_status");

-- AddForeignKey
ALTER TABLE "BusinessConfig" ADD CONSTRAINT "BusinessConfig_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCustomer" ADD CONSTRAINT "TenantCustomer_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPermission" ADD CONSTRAINT "StaffPermission_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "TenantCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleTransaction" ADD CONSTRAINT "SaleTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalTransaction" ADD CONSTRAINT "RentalTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTransaction" ADD CONSTRAINT "ServiceTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalityTransaction" ADD CONSTRAINT "HospitalityTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLineItem" ADD CONSTRAINT "TransactionLineItem_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLineItem" ADD CONSTRAINT "SaleLineItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLineItem" ADD CONSTRAINT "RentalLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalLineItem" ADD CONSTRAINT "RentalLineItem_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLineItem" ADD CONSTRAINT "ServiceLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLineItem" ADD CONSTRAINT "ServiceLineItem_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalityLineItem" ADD CONSTRAINT "HospitalityLineItem_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "TransactionLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalityLineItem" ADD CONSTRAINT "HospitalityLineItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_service_transaction_id_fkey" FOREIGN KEY ("service_transaction_id") REFERENCES "ServiceTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAssignment" ADD CONSTRAINT "ServiceAssignment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "TenantCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "TenantCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_termsVersionId_fkey" FOREIGN KEY ("termsVersionId") REFERENCES "TermsVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
