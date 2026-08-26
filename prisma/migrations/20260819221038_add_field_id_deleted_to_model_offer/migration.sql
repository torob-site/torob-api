/*
  Warnings:

  - Made the column `is_available` on table `offers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `offers` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `is_available` BOOLEAN NOT NULL DEFAULT true;
