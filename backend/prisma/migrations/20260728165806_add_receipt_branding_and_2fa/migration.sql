-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "receiptFooterNote" TEXT NOT NULL DEFAULT 'Thank you for your business!',
ADD COLUMN     "receiptShowSignature" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receiptTitle" TEXT NOT NULL DEFAULT 'RECEIPT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
