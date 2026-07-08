-- CreateTable
CREATE TABLE `ProSubscription` (
    `wallet` VARCHAR(191) NOT NULL,
    `activeUntil` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`wallet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProPayment` (
    `id` VARCHAR(191) NOT NULL,
    `wallet` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NOT NULL,
    `lamports` BIGINT NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `periodEnd` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProPayment_signature_key`(`signature`),
    INDEX `ProPayment_wallet_idx`(`wallet`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;