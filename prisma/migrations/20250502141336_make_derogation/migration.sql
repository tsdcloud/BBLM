-- CreateTable
CREATE TABLE `Derogation` (
    `id` VARCHAR(191) NOT NULL,
    `numRef` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Derogation_numRef_key`(`numRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DerogationLigne` (
    `id` VARCHAR(191) NOT NULL,
    `numRef` VARCHAR(191) NOT NULL,
    `derogationId` VARCHAR(191) NOT NULL,
    `breakdownBudgetLineOfDebitedId` VARCHAR(191) NOT NULL,
    `breakdownBudgetLineOfCreditedId` VARCHAR(191) NOT NULL,
    `Amount` DECIMAL(65, 30) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `DerogationLigne_numRef_key`(`numRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DerogationLigne` ADD CONSTRAINT `DerogationLigne_derogationId_fkey` FOREIGN KEY (`derogationId`) REFERENCES `Derogation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DerogationLigne` ADD CONSTRAINT `DerogationLigne_breakdownBudgetLineOfDebitedId_fkey` FOREIGN KEY (`breakdownBudgetLineOfDebitedId`) REFERENCES `BreakdownBudgetLineOf`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DerogationLigne` ADD CONSTRAINT `DerogationLigne_breakdownBudgetLineOfCreditedId_fkey` FOREIGN KEY (`breakdownBudgetLineOfCreditedId`) REFERENCES `BreakdownBudgetLineOf`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
