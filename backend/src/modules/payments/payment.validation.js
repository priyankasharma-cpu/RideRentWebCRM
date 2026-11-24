import { z } from 'zod';
import { methods, reference, submissionKey } from '../finance/finance.validation.js';
export const recordPaymentInput = z.object({
  amount: z.number().int().min(1).max(100000000),
  purpose: z.enum(['rental', 'deposit']),
  method: z.enum(methods),
  reference,
  submissionKey: submissionKey.optional(),
  note: z.string().max(300).default(''),
});
export const refundPaymentInput = z.object({
  amount: z.number().int().min(1).max(100000000),
  reference,
  submissionKey: submissionKey.optional(),
  reason: z.string().min(3).max(300),
});
