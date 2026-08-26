-- DropForeignKey
ALTER TABLE `offerhistories` DROP FOREIGN KEY `offerHistories_offer_id_fkey`;

-- DropForeignKey
ALTER TABLE `offerimages` DROP FOREIGN KEY `offerImages_offer_id_fkey`;

-- DropForeignKey
ALTER TABLE `offervideos` DROP FOREIGN KEY `offerVideos_offer_id_fkey`;

-- DropIndex
DROP INDEX `offerImages_offer_id_fkey` ON `offerimages`;

-- DropIndex
DROP INDEX `offerVideos_offer_id_fkey` ON `offervideos`;

-- AddForeignKey
ALTER TABLE `offerImages` ADD CONSTRAINT `offerImages_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offerVideos` ADD CONSTRAINT `offerVideos_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offerHistories` ADD CONSTRAINT `offerHistories_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
