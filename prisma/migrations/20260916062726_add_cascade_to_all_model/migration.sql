-- DropForeignKey
ALTER TABLE `alerts` DROP FOREIGN KEY `alerts_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `alerts` DROP FOREIGN KEY `alerts_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `categorylog` DROP FOREIGN KEY `categoryLog_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `offerclicks` DROP FOREIGN KEY `offerClicks_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `offers` DROP FOREIGN KEY `offers_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `productimages` DROP FOREIGN KEY `productImages_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `productprice` DROP FOREIGN KEY `productPrice_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `productspecifications` DROP FOREIGN KEY `productSpecifications_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `productvariants` DROP FOREIGN KEY `productVariants_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `productviews` DROP FOREIGN KEY `productViews_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `productviews` DROP FOREIGN KEY `productViews_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `shop_verifications` DROP FOREIGN KEY `shop_verifications_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopcategories` DROP FOREIGN KEY `shopCategories_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopcontacts` DROP FOREIGN KEY `shopContacts_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopdocuments` DROP FOREIGN KEY `shopDocuments_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopimages` DROP FOREIGN KEY `shopImages_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopmember` DROP FOREIGN KEY `shopMember_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopmember` DROP FOREIGN KEY `shopMember_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopworkinghour` DROP FOREIGN KEY `ShopWorkingHour_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `usersearchhistory` DROP FOREIGN KEY `userSearchHistory_user_id_fkey`;

-- DropIndex
DROP INDEX `alerts_user_id_fkey` ON `alerts`;

-- DropIndex
DROP INDEX `favorites_product_id_fkey` ON `favorites`;

-- DropIndex
DROP INDEX `offers_shop_id_fkey` ON `offers`;

-- DropIndex
DROP INDEX `productImages_product_id_fkey` ON `productimages`;

-- DropIndex
DROP INDEX `reports_product_id_fkey` ON `reports`;

-- DropIndex
DROP INDEX `shopImages_shop_id_fkey` ON `shopimages`;

-- DropIndex
DROP INDEX `shopMember_shop_id_fkey` ON `shopmember`;

-- DropIndex
DROP INDEX `shopMember_user_id_fkey` ON `shopmember`;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productViews` ADD CONSTRAINT `productViews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productViews` ADD CONSTRAINT `productViews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offerClicks` ADD CONSTRAINT `offerClicks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productVariants` ADD CONSTRAINT `productVariants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productImages` ADD CONSTRAINT `productImages_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productSpecifications` ADD CONSTRAINT `productSpecifications_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopImages` ADD CONSTRAINT `shopImages_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopCategories` ADD CONSTRAINT `shopCategories_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopContacts` ADD CONSTRAINT `shopContacts_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShopWorkingHour` ADD CONSTRAINT `ShopWorkingHour_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopDocuments` ADD CONSTRAINT `shopDocuments_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_verifications` ADD CONSTRAINT `shop_verifications_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopMember` ADD CONSTRAINT `shopMember_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopMember` ADD CONSTRAINT `shopMember_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoryLog` ADD CONSTRAINT `categoryLog_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offers` ADD CONSTRAINT `offers_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userSearchHistory` ADD CONSTRAINT `userSearchHistory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productPrice` ADD CONSTRAINT `productPrice_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
