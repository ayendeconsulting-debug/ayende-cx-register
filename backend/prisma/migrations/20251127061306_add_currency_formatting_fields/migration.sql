-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "currencyPosition" TEXT NOT NULL DEFAULT 'before',
ADD COLUMN     "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "decimalSeparator" TEXT NOT NULL DEFAULT '.',
ADD COLUMN     "thousandsSeparator" TEXT NOT NULL DEFAULT ',';
