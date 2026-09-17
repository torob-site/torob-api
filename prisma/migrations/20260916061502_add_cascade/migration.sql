-- DropForeignKey
ALTER TABLE `categorylog` DROP FOREIGN KEY `categoryLog_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `shopcategories` DROP FOREIGN KEY `shopCategories_category_id_fkey`;

-- DropIndex
DROP INDEX `products_category_id_fkey` ON `products`;

-- DropIndex
DROP INDEX `shopCategories_category_id_fkey` ON `shopcategories`;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopCategories` ADD CONSTRAINT `shopCategories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoryLog` ADD CONSTRAINT `categoryLog_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
