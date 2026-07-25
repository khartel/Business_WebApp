-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT';

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN     "discountPercent" DOUBLE PRECISION;
