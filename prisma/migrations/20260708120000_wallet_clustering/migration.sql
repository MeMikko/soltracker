-- CreateTable
CREATE TABLE `WalletCluster` (
    `id` VARCHAR(191) NOT NULL,
    `seedAddress` VARCHAR(191) NOT NULL,
    `nodes` JSON NOT NULL,
    `nodeCount` INTEGER NOT NULL,
    `edgeCount` INTEGER NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WalletCluster_seedAddress_key`(`seedAddress`),
    INDEX `WalletCluster_seedAddress_idx`(`seedAddress`),
    INDEX `WalletCluster_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClusterEdge` (
    `id` VARCHAR(191) NOT NULL,
    `clusterId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `target` VARCHAR(191) NOT NULL,
    `edgeType` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1,
    `label` VARCHAR(191) NULL,
    `metadata` JSON NULL,

    INDEX `ClusterEdge_clusterId_idx`(`clusterId`),
    INDEX `ClusterEdge_source_idx`(`source`),
    INDEX `ClusterEdge_target_idx`(`target`),
    UNIQUE INDEX `ClusterEdge_clusterId_source_target_edgeType_key`(`clusterId`, `source`, `target`, `edgeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClusterEdge` ADD CONSTRAINT `ClusterEdge_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `WalletCluster`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;