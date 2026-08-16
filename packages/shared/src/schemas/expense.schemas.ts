import { z } from "zod";

const splitSchema = z.object({
  userId: z.string().min(1),
  amount: z
    .number()
    .int("Amount must be in paise (integer)")
    .nonnegative()
    .max(2147483647)
    .optional(),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().int().positive().optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  amount: z
    .number()
    .int("Amount must be in paise (integer)")
    .positive()
    .max(2147483647),
  paidById: z.string(),
  category: z
    .enum([
      "FOOD",
      "TRANSPORT",
      "ACCOMMODATION",
      "SHOPPING",
      "ENTERTAINMENT",
      "UTILITIES",
      "RENT",
      "OTHER",
    ])
    .default("OTHER"),
  splitMethod: z
    .enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES", "ITEMIZED"])
    .default("EQUAL"),
  date: z.string().datetime(),
  notes: z.string().max(500).optional(),
  receiptUrl: z
    .string()
    .url()
    .regex(/^https?:\/\//)
    .optional(),
  splits: z.array(splitSchema).min(1),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .extend({ receiptUrl: createExpenseSchema.shape.receiptUrl.nullable() })
  .strict();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
