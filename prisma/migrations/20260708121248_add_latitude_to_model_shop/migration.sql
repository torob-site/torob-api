/*
  Warnings:

  - You are about to drop the column `floor` on the `shops` table. All the data in the column will be lost.
  - You are about to drop the column `plaque` on the `shops` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `shops` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `shops` DROP COLUMN `floor`,
    DROP COLUMN `plaque`,
    DROP COLUMN `unit`,
    ADD COLUMN `latitude` DECIMAL(65, 30) NULL,
    ADD COLUMN `longitude` DECIMAL(65, 30) NULL;
