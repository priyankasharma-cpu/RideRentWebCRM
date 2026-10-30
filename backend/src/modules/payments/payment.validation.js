import { z } from 'zod';
export const recordPaymentInput = z.object({
  amount: z.number().int().min(1).max(100000000),
  purpose: z.enum(['rental', 'deposit']),
  method: z.enum(['Cash', 'UPI', 'Card']),
  note: z.string().max(300).default(''),
});
export const refundPaymentInput = z.object({
  amount: z.number().int().min(1),
  reason: z.string().min(3).max(300),
});
