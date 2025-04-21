/*
  Warnings:

  - A unique constraint covering the columns `[budgetLineOfId,month]` on the table `BreakdownBudgetLineOf` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `BreakdownBudgetLineOf_budgetLineOfId_month_key` ON `BreakdownBudgetLineOf`(`budgetLineOfId`, `month`);
