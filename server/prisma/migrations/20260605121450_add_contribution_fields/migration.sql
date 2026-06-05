/*
  Warnings:

  - Added the required column `updatedAt` to the `Contribution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'CASH',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
