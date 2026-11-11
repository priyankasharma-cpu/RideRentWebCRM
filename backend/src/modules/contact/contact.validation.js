import { z } from 'zod';
export const contactInput = z.object({
  submissionKey: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .max(25)
    .refine((value) => !value || /^[+0-9() .-]{7,25}$/.test(value), 'Enter a valid phone number.')
    .optional()
    .default(''),
  inquiryType: z.enum(['vehicle', 'booking', 'pickup', 'other']),
  message: z.string().trim().min(10).max(3000),
});
export const inquiryListInput = z.object({
  status: z.enum(['all', 'new', 'read']).default('all'),
  offset: z.coerce.number().int().min(0).max(1000000).default(0),
});
export const inquiryStatusInput = z.object({ status: z.enum(['new', 'read']) });
