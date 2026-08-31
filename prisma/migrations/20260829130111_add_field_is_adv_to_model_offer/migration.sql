/*
  Warnings:

  - A unique constraint covering the columns `[user_id,product_id,shop_id,report_reason_id]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `offers` ADD COLUMN `is_adv` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `reports_user_id_product_id_shop_id_report_reason_id_key` ON `reports`(`user_id`, `product_id`, `shop_id`, `report_reason_id`);
