-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_user_id_fkey`;

-- DropIndex
DROP INDEX `reports_user_id_product_id_shop_id_report_reason_id_key` ON `reports`;

-- AlterTable
ALTER TABLE `offers` MODIFY `warranty_duration` INTEGER NULL;
