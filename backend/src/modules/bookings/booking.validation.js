import { z } from 'zod';
import { windowSchema } from '../availability/availability.validation.js';
import { phone } from '../../utils/phone.js';
export const requestBookingOtpInput = z.object({
  reference: z.string().min(5).max(50),
  email: z.string().trim().email().max(150),
});
export const verifyBookingOtpInput = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});
export const bookingSchema = windowSchema.extend({
  vehicleId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .transform(phone)
    .pipe(z.string().regex(/^\d{10,15}$/)),
  email: z.union([z.literal(''), z.string().email().max(150)]).default(''),
  agreement: z.literal(true),
  source: z.enum(['Website', 'Phone', 'Walk-in']).default('Website'),
  verified: z.boolean().default(false),
  notes: z.string().max(2000).default(''),
  helmets: z.number().int().min(0).max(10000).default(0),
  addOns: z
    .array(z.object({ addOnId: z.string().uuid(), quantity: z.number().int().min(1).max(10000) }))
    .max(50)
    .default([]),
});
