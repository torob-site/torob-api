-- DropForeignKey
ALTER TABLE `offers` DROP FOREIGN KEY `offers_warranty_id_fkey`;

-- DropIndex
DROP INDEX `offers_warranty_id_fkey` ON `offers`;

-- AlterTable
ALTER TABLE `offers` MODIFY `warranty_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_warranty_id_fkey` FOREIGN KEY (`warranty_id`) REFERENCES `warranties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
