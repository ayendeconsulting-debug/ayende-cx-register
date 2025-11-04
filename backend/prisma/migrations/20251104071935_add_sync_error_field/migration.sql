-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "syncError" TEXT;
