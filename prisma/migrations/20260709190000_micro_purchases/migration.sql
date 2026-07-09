-- CreateTable
CREATE TABLE `PurchasePayment` (
    `id` VARCHAR(191) NOT NULL,
    `wallet` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NOT NULL,
    `product` VARCHAR(191) NOT NULL,
    `lamports` BIGINT NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    UNIQUE INDEX `PurchasePayment_signature_key`(`signature`),
    INDEX `PurchasePayment_wallet_idx`(`wallet`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchPackBalance` (
    `wallet` VARCHAR(191) NOT NULL,
    `remaining` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`wallet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TokenUnlock` (
    `id` VARCHAR(191) NOT NULL,
    `wallet` VARCHAR(191) NOT NULL,
    `mintAddress` VARCHAR(191) NOT NULL,
    `unlockedUntil` DATETIME(3) NOT NULL,

    INDEX `TokenUnlock_wallet_idx`(`wallet`),
    INDEX `TokenUnlock_mintAddress_idx`(`mintAddress`),
    UNIQUE INDEX `TokenUnlock_wallet_mintAddress_key`(`wallet`, `mintAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;