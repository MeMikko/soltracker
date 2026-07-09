-- CreateTable
CREATE TABLE `TokenSearchStat` (
    `mintAddress` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `symbol` VARCHAR(64) NULL,
    `imageUrl` TEXT NULL,
    `searchCount` INTEGER NOT NULL DEFAULT 1,
    `lastSearchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TokenSearchStat_lastSearchedAt_idx`(`lastSearchedAt`),
    INDEX `TokenSearchStat_searchCount_idx`(`searchCount`),
    PRIMARY KEY (`mintAddress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;