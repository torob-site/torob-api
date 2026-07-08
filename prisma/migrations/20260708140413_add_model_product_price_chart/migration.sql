-- CreateTable
CREATE TABLE `ProductPriceChart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `min_price` INTEGER NOT NULL,
    `avg_price` INTEGER NOT NULL,
    `max_price` INTEGER NOT NULL,

    INDEX `ProductPriceChart_product_id_idx`(`product_id`),
    UNIQUE INDEX `ProductPriceChart_product_id_date_key`(`product_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductPriceChart` ADD CONSTRAINT `ProductPriceChart_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
