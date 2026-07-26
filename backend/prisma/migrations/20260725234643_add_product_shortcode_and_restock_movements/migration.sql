-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RESTOCK', 'TRANSFER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shortCode" TEXT;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "type" "MovementType" NOT NULL DEFAULT 'TRANSFER',
ALTER COLUMN "fromWarehouseId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_businessId_shortCode_key" ON "Product"("businessId", "shortCode");
