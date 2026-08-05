/*
  Warnings:

  - Made the column `lowStockThresholdsByUnit` on table `Business` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill existing NULL rows (every business created before this feature
-- shipped) before the NOT NULL constraint below can be applied.
UPDATE "Business" SET "lowStockThresholdsByUnit" = '{}'::jsonb WHERE "lowStockThresholdsByUnit" IS NULL;

-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "lowStockThresholdsByUnit" SET NOT NULL,
ALTER COLUMN "lowStockThresholdsByUnit" SET DEFAULT '{}';
