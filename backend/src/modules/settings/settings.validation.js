import { z } from 'zod';
export const updateShopSettingsInput = z.object({
  name: z.string().min(2).max(80),
  phoneDisplay: z.string().min(5).max(30),
  phoneTel: z.string().regex(/^\+\d{10,15}$/),
  phonePlaceholder: z.boolean(),
  email: z.string().email(),
  address: z.string().min(3).max(300),
  timezone: z.literal('Asia/Kolkata'),
  taxBps: z.number().int().min(0).max(5000),
  roundingMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  lateGraceMinutes: z.number().int().min(0).max(120),
  cancellationHours: z.number().min(0).max(72),
  maxRentalDays: z.number().int().min(1).max(90),
  currency: z.literal('INR'),
  fuelPolicy: z.string().max(1000),
  distancePolicy: z.string().max(1000),
});
