-- Rebuild the materialized balances, including expenses whose payer had no split.
BEGIN;
LOCK TABLE expenses, expense_splits, settlements, group_member_balances IN SHARE ROW EXCLUSIVE MODE;
WITH entries AS (
  SELECT "groupId", "paidById" AS "userId", amount FROM expenses WHERE NOT "isDeleted"
  UNION ALL
  SELECT e."groupId", s."userId", -s.amount FROM expense_splits s JOIN expenses e ON s."expenseId" = e.id WHERE NOT e."isDeleted"
  UNION ALL
  SELECT "groupId", "payerId", amount FROM settlements WHERE status = 'CONFIRMED' AND NOT "isDeleted"
  UNION ALL
  SELECT "groupId", "receiverId", -amount FROM settlements WHERE status = 'CONFIRMED' AND NOT "isDeleted"
  UNION ALL
  SELECT "groupId", "userId", 0 FROM group_member_balances
)
INSERT INTO group_member_balances (id, "groupId", "userId", balance)
SELECT gen_random_uuid()::text, "groupId", "userId", sum(amount)::integer FROM entries GROUP BY "groupId", "userId"
ON CONFLICT ("groupId", "userId") DO UPDATE SET balance = excluded.balance;
COMMIT;
