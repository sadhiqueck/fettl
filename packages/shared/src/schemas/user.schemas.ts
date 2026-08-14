import { z } from "zod";
import { VPA_REGEX } from "./vpa.schema";

export const phoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    "Must be a valid international phone number (e.g. +919876543210)",
  )
  .nullable();

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80)
    .min(2, "Name must be at least 2 characters")
    .optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional(),
  phone: phoneSchema.optional(),
  vpa: z
    .string()
    .regex(VPA_REGEX, "Enter a valid UPI ID (e.g. yourname@upi)")
    .nullable()
    .optional(),
  isOnboarded: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
