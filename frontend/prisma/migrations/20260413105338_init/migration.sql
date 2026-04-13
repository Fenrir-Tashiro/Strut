-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `roles` VARCHAR(191) NOT NULL DEFAULT 'searcher',
    `bio` TEXT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `total_earned` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outfits` (
    `id` VARCHAR(191) NOT NULL,
    `walker_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(191) NULL,
    `date` DATE NOT NULL DEFAULT (CURDATE()),
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `location_name` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `buy_count` INTEGER NOT NULL DEFAULT 0,
    `is_event` BOOLEAN NOT NULL DEFAULT false,
    `event_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outfit_items` (
    `id` VARCHAR(191) NOT NULL,
    `outfit_id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `brand_name` VARCHAR(191) NULL,
    `item_name` VARCHAR(191) NULL,
    `price` INTEGER NULL,
    `buy_url` VARCHAR(191) NULL,
    `image_url` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interactions` (
    `id` VARCHAR(191) NOT NULL,
    `outfit_id` VARCHAR(191) NOT NULL,
    `item_id` VARCHAR(191) NULL,
    `searcher_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `points_awarded` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand_requests` (
    `id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `walker_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fee` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `deadline` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `venue_name` VARCHAR(191) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `radius_m` INTEGER NOT NULL DEFAULT 200,
    `start_at` DATETIME(3) NULL,
    `end_at` DATETIME(3) NULL,
    `qr_code` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `outfits` ADD CONSTRAINT `outfits_walker_id_fkey` FOREIGN KEY (`walker_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `outfits` ADD CONSTRAINT `outfits_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `outfit_items` ADD CONSTRAINT `outfit_items_outfit_id_fkey` FOREIGN KEY (`outfit_id`) REFERENCES `outfits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_outfit_id_fkey` FOREIGN KEY (`outfit_id`) REFERENCES `outfits`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `outfit_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_searcher_id_fkey` FOREIGN KEY (`searcher_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brand_requests` ADD CONSTRAINT `brand_requests_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brand_requests` ADD CONSTRAINT `brand_requests_walker_id_fkey` FOREIGN KEY (`walker_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
