import { z } from 'zod';
export const inspection = z.object({
  odometer: z.number().int().min(0).max(9999999),
  fuel: z.enum(['Empty', 'Quarter', 'Half', 'Three quarters', 'Full']),
  condition: z.string().min(2).max(200),
  notes: z.string().max(2000).default(''),
});
export const pickUpRentalInput = inspection;
export const returnRentalInput = inspection.extend({
  additional: z.number().int().min(0).max(100000000).default(0),
});
export const completeRentalInput = z.object({
  roadReady: z.boolean(),
});
