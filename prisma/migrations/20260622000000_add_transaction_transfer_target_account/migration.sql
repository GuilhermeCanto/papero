-- Add nullable target account support for single-row account-to-account transfers.
ALTER TABLE "Transaction" ADD COLUMN "transferTargetBankAccountId" TEXT;

CREATE INDEX "Transaction_companyId_transferTargetBankAccountId_idx" ON "Transaction"("companyId", "transferTargetBankAccountId");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transferTargetBankAccountId_fkey" FOREIGN KEY ("transferTargetBankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
