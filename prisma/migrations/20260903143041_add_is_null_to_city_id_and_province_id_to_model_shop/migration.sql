-- DropForeignKey
ALTER TABLE `shops` DROP FOREIGN KEY `shops_city_id_fkey`;

-- DropForeignKey
ALTER TABLE `shops` DROP FOREIGN KEY `shops_province_id_fkey`;

-- DropIndex
DROP INDEX `shops_city_id_fkey` ON `shops`;

-- DropIndex
DROP INDEX `shops_province_id_fkey` ON `shops`;

-- AlterTable
ALTER TABLE `shops` MODIFY `address` VARCHAR(191) NULL,
    MODIFY `province_id` INTEGER NULL,
    MODIFY `city_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `shops` ADD CONSTRAINT `shops_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shops` ADD CONSTRAINT `shops_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
