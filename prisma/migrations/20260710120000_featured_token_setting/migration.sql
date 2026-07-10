-- CreateTable
CREATE TABLE `FeaturedTokenSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `mint` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
);

-- Seed default featured token
INSERT INTO `FeaturedTokenSetting` (`id`, `mint`, `enabled`, `updatedAt`, `updatedBy`)
VALUES (1, '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump', true, CURRENT_TIMESTAMP(3), NULL);