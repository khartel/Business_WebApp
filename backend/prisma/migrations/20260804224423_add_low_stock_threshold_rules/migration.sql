-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "defaultLowStockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "lowStockThresholdsByUnit" JSONB;

-- AlterTable
ALTER TABLE "WarehouseStock" ALTER COLUMN "lowStockThreshold" DROP NOT NULL,
ALTER COLUMN "lowStockThreshold" DROP DEFAULT;
