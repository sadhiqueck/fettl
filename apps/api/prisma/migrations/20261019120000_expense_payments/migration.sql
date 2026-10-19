BEGIN;
ALTER TABLE settlements ADD COLUMN "expenseId" TEXT, ADD COLUMN "reportId" TEXT;
ALTER TABLE settlements ADD CONSTRAINT "settlements_expenseId_fkey"
  FOREIGN KEY ("expenseId") REFERENCES expenses(id) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "settlements_expenseId_idx" ON settlements ("expenseId");
CREATE UNIQUE INDEX "settlements_groupId_payerId_reportId_key"
  ON settlements ("groupId", "payerId", "reportId");
COMMIT;
