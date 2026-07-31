/*
  Warnings:

  - You are about to drop the column `key` on the `productspecifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[product_id,specification_id]` on the table `productSpecifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `specification_id` to the `productSpecifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `products` ADD COLUMN `is_authentic` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `productspecifications` DROP COLUMN `key`,
    ADD COLUMN `specification_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `specifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `filterable` BOOLEAN NOT NULL DEFAULT true,
    `category_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `specifications_category_id_idx`(`category_id`),
    UNIQUE INDEX `specifications_title_category_id_key`(`title`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `productSpecifications_specification_id_idx` ON `productSpecifications`(`specification_id`);

-- CreateIndex
CREATE UNIQUE INDEX `productSpecifications_product_id_specification_id_key` ON `productSpecifications`(`product_id`, `specification_id`);

-- AddForeignKey
ALTER TABLE `specifications` ADD CONSTRAINT `specifications_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productSpecifications` ADD CONSTRAINT `productSpecifications_specification_id_fkey` FOREIGN KEY (`specification_id`) REFERENCES `specifications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;