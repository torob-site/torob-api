-- AlterTable
ALTER TABLE `products` ADD COLUMN `offer_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `priceWatchs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `watch_price` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `priceWatchs` ADD CONSTRAINT `priceWatchs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priceWatchs` ADD CONSTRAINT `priceWatchs_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
