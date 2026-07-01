-- CreateEnum
CREATE TYPE "BankAccountCashFlowRole" AS ENUM ('OPERATING', 'RESERVE');

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN "cashFlowRole" "BankAccountCashFlowRole" NOT NULL DEFAULT 'OPERATING';
