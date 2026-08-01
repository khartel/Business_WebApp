-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "unitQuantity" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "unitQuantity" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ProductUnit" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductUnit_productId_label_key" ON "ProductUnit"("productId", "label");

-- AddForeignKey
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
