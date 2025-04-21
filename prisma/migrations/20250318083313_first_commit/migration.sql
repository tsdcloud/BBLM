-- CreateTable
CREATE TABLE `MajorBudgetLine` (
    `id` VARCHAR(191) NOT NULL,
    `numRef` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `MajorBudgetLine_numRef_key`(`numRef`),
    UNIQUE INDEX `MajorBudgetLine_code_key`(`code`),
    UNIQUE INDEX `MajorBudgetLine_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BudgetLineName` (
    `id` VARCHAR(191) NOT NULL,
    `numRef` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `majorBudgetLineId` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `BudgetLineName_numRef_key`(`numRef`),
    UNIQUE INDEX `BudgetLineName_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BudgetLineOf` (
    `id` VARCHAR(191) NOT NULL,
    `numRef` VARCHAR(191) NOT NULL,
    `budgetLineNameId` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `BudgetLineOf_numRef_key`(`numRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BreakdownBudgetLineOf` (
    `id` VARCHAR(191) NOT NULL,
    `numRef` VARCHAR(191) NOT NULL,
    `budgetLineOfId` VARCHAR(191) NOT NULL,
    `month` ENUM('JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE') NOT NULL,
    `estimatedAmount` DECIMAL(65, 30) NOT NULL,
    `realAmount` DECIMAL(65, 30) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `BreakdownBudgetLineOf_numRef_key`(`numRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BudgetLineName` ADD CONSTRAINT `BudgetLineName_majorBudgetLineId_fkey` FOREIGN KEY (`majorBudgetLineId`) REFERENCES `MajorBudgetLine`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BudgetLineOf` ADD CONSTRAINT `BudgetLineOf_budgetLineNameId_fkey` FOREIGN KEY (`budgetLineNameId`) REFERENCES `BudgetLineName`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BreakdownBudgetLineOf` ADD CONSTRAINT `BreakdownBudgetLineOf_budgetLineOfId_fkey` FOREIGN KEY (`budgetLineOfId`) REFERENCES `BudgetLineOf`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
