import { z } from "zod";

export const createSettlementSchema = z.object({
  payerId: z.string().min(1),
  receiverId: z.string().min(1),
  amount: z
    .number()
    .int("Amount must be in paise (integer)")
    .positive()
    .max(2147483647),
  note: z.string().max(200).optional(),
  expenseId: z.string().min(1).optional(),
  reportId: z.string().uuid().optional(),
}).refine(({ expenseId, reportId }) => Boolean(expenseId) === Boolean(reportId), {
  message: "Expense payments require a report ID.",
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
