-- CreateTable
CREATE TABLE `WalletWarning` (
    `wallet` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `addedBy` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`wallet`),
    INDEX `WalletWarning_addedAt_idx`(`addedAt`)
);