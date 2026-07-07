-- CreateTable
CREATE TABLE `Wallet` (
    `address` VARCHAR(191) NOT NULL,
    `firstSeenAt` DATETIME(3) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `solBalance` DECIMAL(20, 9) NOT NULL,
    `txCount` INTEGER NOT NULL DEFAULT 0,
    `cachedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`address`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Token` (
    `mintAddress` VARCHAR(191) NOT NULL,
    `creatorWallet` VARCHAR(191) NULL,
    `supply` DECIMAL(38, 0) NOT NULL,
    `mintAuthority` VARCHAR(191) NULL,
    `freezeAuthority` VARCHAR(191) NULL,
    `holderCount` INTEGER NOT NULL DEFAULT 0,
    `cachedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`mintAddress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiskScore` (
    `id` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetAddress` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `breakdown` JSON NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RiskScore_targetType_targetAddress_key`(`targetType`, `targetAddress`),
    INDEX `RiskScore_targetAddress_idx`(`targetAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchLog` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `SearchLog_identifier_date_key`(`identifier`, `date`),
    INDEX `SearchLog_identifier_date_idx`(`identifier`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CacheEntry` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `cachedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `CacheEntry_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;