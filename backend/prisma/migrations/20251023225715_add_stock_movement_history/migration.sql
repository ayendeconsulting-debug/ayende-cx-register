/*
  Warnings:

  - Changed the type of `movementType` on the `StockMovement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('ADD', 'REMOVE', 'ADJUST');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('NEW_STOCK_RECEIVED', 'SUPPLIER_RETURN_CREDIT', 'FOUND_ITEMS', 'DAMAGED_GOODS', 'THEFT_SHRINKAGE', 'EXPIRED_ITEMS', 'CUSTOMER_RETURN_DEFECTIVE', 'PHYSICAL_COUNT_CORRECTION', 'SYSTEM_ERROR_CORRECTION', 'TRANSFER_CORRECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'AUTO_APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdjustmentMovementType" AS ENUM ('ADJUSTMENT', 'SALE', 'PURCHASE', 'TRANSFER', 'RETURN');

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "movementType",
ADD COLUMN     "movementType" "StockMovementType" NOT NULL;

-- DropEnum
DROP TYPE "MovementType";

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "totalValue" DECIMAL(10,2) NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "customReason" TEXT,
    "notes" TEXT,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment_approvals" (
    "id" TEXT NOT NULL,
    "adjustmentId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "decision" TEXT,
    "rejectionReason" TEXT,
    "approvalNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "stock_adjustment_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement_history" (
    "id" TEXT NOT NULL,
    "movementType" "AdjustmentMovementType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "adjustmentId" TEXT,
    "quantityBefore" INTEGER NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "totalValue" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_adjustments_adjustmentNumber_key" ON "stock_adjustments"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "stock_adjustments_productId_idx" ON "stock_adjustments"("productId");

-- CreateIndex
CREATE INDEX "stock_adjustments_createdBy_idx" ON "stock_adjustments"("createdBy");

-- CreateIndex
CREATE INDEX "stock_adjustments_status_idx" ON "stock_adjustments"("status");

-- CreateIndex
CREATE INDEX "stock_adjustments_createdAt_idx" ON "stock_adjustments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_adjustment_approvals_adjustmentId_key" ON "stock_adjustment_approvals"("adjustmentId");

-- CreateIndex
CREATE INDEX "stock_adjustment_approvals_status_idx" ON "stock_adjustment_approvals"("status");

-- CreateIndex
CREATE INDEX "stock_adjustment_approvals_submittedAt_idx" ON "stock_adjustment_approvals"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movement_history_adjustmentId_key" ON "stock_movement_history"("adjustmentId");

-- CreateIndex
CREATE INDEX "stock_movement_history_productId_idx" ON "stock_movement_history"("productId");

-- CreateIndex
CREATE INDEX "stock_movement_history_movementType_idx" ON "stock_movement_history"("movementType");

-- CreateIndex
CREATE INDEX "stock_movement_history_createdAt_idx" ON "stock_movement_history"("createdAt");

-- CreateIndex
CREATE INDEX "stock_movement_history_performedBy_idx" ON "stock_movement_history"("performedBy");

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_approvals" ADD CONSTRAINT "stock_adjustment_approvals_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_approvals" ADD CONSTRAINT "stock_adjustment_approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_history" ADD CONSTRAINT "stock_movement_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_history" ADD CONSTRAINT "stock_movement_history_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_history" ADD CONSTRAINT "stock_movement_history_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
