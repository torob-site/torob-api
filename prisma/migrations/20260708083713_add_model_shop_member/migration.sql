-- AlterTable
ALTER TABLE `shopworkinghour` MODIFY `start_time` TIME NOT NULL,
    MODIFY `end_time` TIME NOT NULL;

-- CreateTable
CREATE TABLE `shopMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `is_owner` BOOLEAN NOT NULL DEFAULT false,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `user_id` INTEGER NOT NULL,
    `shop_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shopMember` ADD CONSTRAINT `shopMember_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopMember` ADD CONSTRAINT `shopMember_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
