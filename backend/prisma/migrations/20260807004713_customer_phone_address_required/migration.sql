/*
  Warnings:

  - Added the required column `address` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill: this is test/demo data (confirmed with Victor, 2026-08-07), so an
-- empty-string backfill is fine - existing customers just need to be edited
-- to add real values next time they're touched, not migrated with fabricated
-- data.
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';

UPDATE "Customer" SET "phone" = '' WHERE "phone" IS NULL;

ALTER TABLE "Customer" ALTER COLUMN "phone" SET NOT NULL;

-- Drop the temporary default so the application is always responsible for
-- supplying "address" going forward, matching how "phone" has no DB-level
-- default either.
ALTER TABLE "Customer" ALTER COLUMN "address" DROP DEFAULT;
